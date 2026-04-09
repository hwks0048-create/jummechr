import { NextRequest, NextResponse } from "next/server";

// 점심 직장인에게 부적합한 고가/주류 업종 필터 (카테고리 + 가게명 둘 다 체크)
const EXCLUDED = /파인다이닝|다이닝|와인바|와인 바|루프탑바|스카이라운지|호텔 레스토랑|오마카세|뷔페|칵테일|위스키|양조장|브루어리|펍|클럽|라운지바/i;

// 카카오 카테고리 → 점메추 4대 카테고리 매핑
function classify(categoryName: string, placeName: string): "한식" | "중식" | "일식" | "양식" | null {
  if (EXCLUDED.test(categoryName) || EXCLUDED.test(placeName)) return null;
  if (/한식/.test(categoryName)) return "한식";
  if (/중식|중국/.test(categoryName)) return "중식";
  if (/일식/.test(categoryName)) return "일식";
  if (/양식|분식|패스트푸드|카페|간식|인도|태국|베트남|멕시|이탈리|브런치/.test(categoryName)) return "양식";
  if (/음식점/.test(categoryName)) return "양식";
  return null;
}

interface KakaoPlace {
  place_name: string;
  category_name: string;
  address_name: string;
  road_address_name: string;
  phone: string;
  place_url: string;
  distance: string;
  x: string;
  y: string;
}

const KAKAO_HEADERS = {
  Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
  KA: "sdk/1.0.0 os/javascript origin/https://jummechr.vercel.app",
};

// 카카오 로컬 API — 좌표 + 반경으로 음식점 검색
async function searchKakao(lat: number, lng: number, radius: number, page: number): Promise<KakaoPlace[]> {
  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/category.json?category_group_code=FD6&x=${lng}&y=${lat}&radius=${radius}&sort=distance&size=15&page=${page}`,
    { headers: KAKAO_HEADERS }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.documents ?? []) as KakaoPlace[];
}

// 키워드 검색 — 카테고리 버킷이 비었을 때 확장 반경으로 보완
async function searchKakaoKeyword(lat: number, lng: number, query: string, radius: number): Promise<KakaoPlace[]> {
  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&category_group_code=FD6&x=${lng}&y=${lat}&radius=${radius}&sort=distance&size=15`,
    { headers: KAKAO_HEADERS }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.documents ?? []) as KakaoPlace[];
}

export async function GET(req: NextRequest) {
  const lat = parseFloat(req.nextUrl.searchParams.get("lat") ?? "");
  const lng = parseFloat(req.nextUrl.searchParams.get("lng") ?? "");

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: "위치 정보가 필요합니다." }, { status: 400 });
  }

  const excludeRaw = req.nextUrl.searchParams.get("exclude") ?? "";
  const excluded = new Set(excludeRaw.split(",").map((s) => s.trim()).filter(Boolean));

  // 500m 반경, 5페이지(최대 75개)
  const pages = await Promise.all(
    [1, 2, 3, 4, 5].map((p) => searchKakao(lat, lng, 500, p))
  );
  const allPlaces = pages.flat();

  // 4대 카테고리별로 분류
  const buckets: Record<string, KakaoPlace[]> = {
    "한식": [],
    "중식": [],
    "일식": [],
    "양식": [],
  };

  for (const place of allPlaces) {
    const cat = classify(place.category_name, place.place_name);
    if (cat) buckets[cat].push(place);
  }

  // 빈 카테고리에 대해 키워드 검색으로 보완 (최대 1000m)
  const FALLBACK_QUERY: Record<string, string> = { 한식: "한식", 중식: "중국집 중식", 일식: "일식 일본음식", 양식: "양식 파스타" };
  const emptyCategories = Object.keys(buckets).filter((cat) => buckets[cat].length === 0);
  if (emptyCategories.length > 0) {
    await Promise.all(
      emptyCategories.map(async (cat) => {
        const extra = await searchKakaoKeyword(lat, lng, FALLBACK_QUERY[cat], 1000);
        for (const place of extra) {
          const c = classify(place.category_name, place.place_name);
          if (c === cat) buckets[cat].push(place);
        }
      })
    );
  }

  // 각 카테고리에서 랜덤 1개 선택
  const categories = ["한식", "중식", "일식", "양식"] as const;
  const restaurants = categories
    .map((cat) => {
      const fresh = buckets[cat].filter((p) => !excluded.has(p.place_name));
      const pool = fresh.length > 0 ? fresh : buckets[cat];
      if (pool.length === 0) return null;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      return {
        title: pick.place_name,
        category: cat,
        address: pick.address_name,
        roadAddress: pick.road_address_name,
        description: pick.category_name.split(" > ").slice(1).join(" > "),
        link: pick.place_url,
        lat: parseFloat(pick.y),
        lng: parseFloat(pick.x),
        distance: parseInt(pick.distance),
      };
    })
    .filter(Boolean);

  return NextResponse.json({ restaurants, totalNearby: allPlaces.length });
}
