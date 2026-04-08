"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, RotateCcw, Shuffle, ChevronRight, Soup, Fish, Sandwich } from "lucide-react";
import type { Restaurant } from "@/components/NaverMap";

const NaverMap = dynamic(() => import("@/components/NaverMap"), { ssr: false });

type Phase = "idle" | "locating" | "fetching" | "done" | "error";

const CATEGORIES = [
  { icon: Soup,     color: "#FF3B30", label: "한식" },
  { icon: Fish,     color: "#007AFF", label: "일식·중식" },
  { icon: Sandwich, color: "#34C759", label: "양식·기타" },
];

export default function Home() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>();
  const [totalNearby, setTotalNearby] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  async function recommend() {
    setPhase("locating");
    setRestaurants([]);
    setTotalNearby(0);
    setErrorMsg("");

    if (!navigator.geolocation) {
      setErrorMsg("위치 서비스를 지원하지 않는 브라우저예요.");
      setPhase("error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLocation({ lat, lng });
        setPhase("fetching");
        try {
          const res = await fetch(`/api/restaurants?lat=${lat}&lng=${lng}`);
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "서버 오류");
          setRestaurants(data.restaurants ?? []);
          setTotalNearby(data.totalNearby ?? 0);
          setPhase("done");
        } catch (e: unknown) {
          setErrorMsg(e instanceof Error ? e.message : "오류가 발생했어요.");
          setPhase("error");
        }
      },
      (err) => {
        setErrorMsg(err.code === err.PERMISSION_DENIED ? "위치 권한을 허용해주세요." : "위치를 가져올 수 없어요.");
        setPhase("error");
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }

  const isLoading = phase === "locating" || phase === "fetching";

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "-apple-system,'Apple SD Gothic Neo','맑은 고딕',sans-serif" }}>

      {/* 헤더 */}
      <header style={{ background: "#111", padding: "40px 24px 36px", textAlign: "center" }}>
        <p style={{ color: "#FF3B30", fontSize: 12, fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", margin: "0 0 10px" }}>
          LUNCH PICK
        </p>
        <h1 style={{ color: "#fff", fontSize: "clamp(2.2rem, 8vw, 3.2rem)", fontWeight: 900, letterSpacing: "-2px", margin: "0 0 6px", lineHeight: 1 }}>
          점메추 지도
        </h1>
        <p style={{ color: "#666", fontSize: 14, margin: "0 0 28px" }}>
          오늘 점심, 지금 뽑기
        </p>

        <button
          onClick={recommend}
          disabled={isLoading}
          style={{
            background: isLoading ? "#333" : "#FF3B30",
            color: "#fff",
            border: "none",
            borderRadius: 14,
            padding: "16px 40px",
            fontSize: 16,
            fontWeight: 800,
            cursor: isLoading ? "not-allowed" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            letterSpacing: "-0.3px",
            transition: "background .15s",
          }}
        >
          {isLoading ? (
            <><Shuffle size={18} style={{ animation: "spin .8s linear infinite" }} />
              {phase === "locating" ? "위치 확인 중" : "탐색 중"}&hellip;</>
          ) : phase === "done" ? (
            <><RotateCcw size={17} />다시 뽑기</>
          ) : (
            <><Shuffle size={17} />뽑기 시작</>
          )}
        </button>
      </header>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* 본문 */}
      <main style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px 60px" }}>

        {phase === "error" && (
          <div style={{ background: "#FFF0F0", border: "1px solid #FFD0D0", borderRadius: 12, padding: "12px 16px", color: "#CC0000", fontSize: 14, marginBottom: 16 }}>
            {errorMsg}
          </div>
        )}

        {phase === "done" && restaurants.length > 0 && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 16, color: "#999", fontSize: 13 }}>
              <MapPin size={13} />
              <span>500m 내 {totalNearby}곳 중 추천</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              {restaurants.map((r, i) => {
                const cat = CATEGORIES[i] ?? CATEGORIES[0];
                const Icon = cat.icon;
                const dist = (r as Record<string, unknown>).distance as number | undefined;
                const href = r.link || `https://map.naver.com/p/search/${encodeURIComponent(r.title)}`;

                return (
                  <a key={i} href={href} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 14, background: "#fff", borderRadius: 14, padding: "16px", textDecoration: "none", color: "inherit", boxShadow: "0 1px 4px rgba(0,0,0,.07)", border: "1px solid #f0f0f0" }}>

                    <div style={{ width: 44, height: 44, borderRadius: 12, background: cat.color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={22} color={cat.color} strokeWidth={2} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: cat.color }}>{r.category}</span>
                        {dist != null && <span style={{ fontSize: 11, color: "#bbb" }}>{dist}m</span>}
                      </div>
                      <p style={{ fontWeight: 700, fontSize: 15, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.3px" }}>
                        {r.title}
                      </p>
                      {(r.roadAddress || r.address) && (
                        <p style={{ fontSize: 12, color: "#aaa", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {r.roadAddress || r.address}
                        </p>
                      )}
                    </div>

                    <ChevronRight size={16} color="#ddd" />
                  </a>
                );
              })}
            </div>

            {userLocation && (
              <div style={{ borderRadius: 14, overflow: "hidden", height: 240, border: "1px solid #f0f0f0" }}>
                <NaverMap restaurants={restaurants} userLocation={userLocation} categoryColors={CATEGORIES.map(c => c.color)} />
              </div>
            )}
          </>
        )}

        {/* SEO 콘텐츠 — 항상 렌더 (구글 크롤러가 읽을 수 있도록) */}
        <article style={{ marginTop: phase === "idle" ? 24 : 40, display: "flex", flexDirection: "column", gap: 20 }}>
          <section style={{ padding: "20px", borderRadius: 14, background: "#fff", border: "1px solid #f0f0f0" }}>
            <h2 style={{ fontWeight: 700, fontSize: 15, margin: "0 0 8px", color: "#111" }}>점메추 지도 — 점심 메뉴 추천 서비스</h2>
            <p style={{ fontSize: 13, color: "#888", lineHeight: 1.8, margin: 0 }}>
              <strong>점메추</strong>는 &lsquo;점심 메뉴 추천&rsquo;의 줄임말이에요.
              매일 &ldquo;오늘 점심 뭐 먹지?&rdquo; 고민하는 직장인을 위해 만들었어요.
              버튼 한 번이면 내 위치 500m 이내 맛집 3곳을 <strong>한식·일식·양식</strong> 각각 다른 카테고리로 골라드립니다.
              마음에 안 들면 다시 뽑기 — 매번 다른 가게가 나와요.
            </p>
          </section>

          <section style={{ padding: "20px", borderRadius: 14, background: "#fff", border: "1px solid #f0f0f0" }}>
            <h2 style={{ fontWeight: 700, fontSize: 15, margin: "0 0 8px", color: "#111" }}>이런 분들에게 추천해요</h2>
            <ul style={{ fontSize: 13, color: "#888", lineHeight: 2, margin: 0, paddingLeft: 18 }}>
              <li>매일 점심 메뉴 고르기 지치는 직장인</li>
              <li>회사 근처 새로운 맛집을 발견하고 싶은 분</li>
              <li>점심시간 1시간 안에 식사하고 돌아와야 하는 분</li>
              <li>한식만 먹다가 다른 종류도 먹어보고 싶은 분</li>
            </ul>
          </section>

          <section style={{ padding: "20px", borderRadius: 14, background: "#fff", border: "1px solid #f0f0f0" }}>
            <h2 style={{ fontWeight: 700, fontSize: 15, margin: "0 0 8px", color: "#111" }}>점메추 지도 사용법</h2>
            <ol style={{ fontSize: 13, color: "#888", lineHeight: 2, margin: 0, paddingLeft: 18 }}>
              <li><strong>뽑기 시작</strong> 버튼을 눌러주세요</li>
              <li>위치 권한을 허용하면 자동으로 내 주변을 검색해요</li>
              <li>한식·일식·양식 3곳이 추천돼요</li>
              <li>카드를 누르면 카카오맵에서 상세 정보를 볼 수 있어요</li>
              <li>마음에 안 들면 <strong>다시 뽑기</strong> — 다른 가게가 나와요</li>
            </ol>
          </section>
        </article>
      </main>

      <footer style={{ textAlign: "center", paddingBottom: 32, fontSize: 12, color: "#ccc" }}>
        점메추 지도 · 위치 정보는 저장되지 않아요
      </footer>
    </div>
  );
}
