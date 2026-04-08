import { NextRequest, NextResponse } from "next/server";

// 카카오 카테고리 → 점메추 3대 카테고리 매핑
function classify(categoryName: string): "한식" | "일식·중식" | "양식·기타" | null {
  if (/한식/.test(categoryName)) return "한식";
  if (/일식|중식/.test(categoryName)) return "일식·중식";
  if (/양식|분식|패스트푸드|뷔페|카페|간식|인도|태국|베트남|멕시|이탈리|브런치/.test(categoryName)) return "양식·기타";
  // 기타 음식점도 양식·기타로
  if (/음식점/.test(categoryName)) return "양식·기타";
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

// 카카오 로컬 API — 좌표 + 반경으로 음식점 검색
async function searchKakao(lat: number, lng: number, radius: number, page: number): Promise<KakaoPlace[]> {
  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/category.json?category_group_code=FD6&x=${lng}&y=${lat}&radius=${radius}&sort=distance&size=15&page=${page}`,
    {
      headers: {
        Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
        KA: "sdk/1.0.0 os/javascript origin/http://localhost:3000",
      },
    }
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

  // 500m 반경, 3페이지(최대 45개) 가져오기
  const [p1, p2, p3] = await Promise.all([
    searchKakao(lat, lng, 500, 1),
    searchKakao(lat, lng, 500, 2),
    searchKakao(lat, lng, 500, 3),
  ]);
  const allPlaces = [...p1, ...p2, ...p3];

  // 3대 카테고리별로 분류
  const buckets: Record<string, KakaoPlace[]> = {
    "한식": [],
    "일식·중식": [],
    "양식·기타": [],
  };

  for (const place of allPlaces) {
    const cat = classify(place.category_name);
    if (cat) buckets[cat].push(place);
  }

  // 각 카테고리에서 랜덤 1개 선택
  const categories = ["한식", "일식·중식", "양식·기타"] as const;
  const restaurants = categories
    .map((cat) => {
      const pool = buckets[cat];
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

  return NextResponse.json({
    restaurants,
    totalNearby: allPlaces.length,
  });
}
