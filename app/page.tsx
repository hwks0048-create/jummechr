"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { MapPin, RotateCcw, Shuffle, ChevronRight, Soup, Fish, Sandwich, Beef, Share2 } from "lucide-react";
import type { Restaurant } from "@/components/NaverMap";

const NaverMap = dynamic(() => import("@/components/NaverMap"), { ssr: false });

type Phase = "idle" | "locating" | "fetching" | "done" | "error";

const CATEGORIES = [
  { icon: Soup,     color: "#FF3B30", label: "한식" },
  { icon: Beef,     color: "#FF9500", label: "중식" },
  { icon: Fish,     color: "#007AFF", label: "일식" },
  { icon: Sandwich, color: "#34C759", label: "양식" },
];

export default function Home() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>();
  const [totalNearby, setTotalNearby] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const seenRef = useRef<Set<string>>(new Set());
  const clickCountRef = useRef(0);

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

        clickCountRef.current += 1;
        if (clickCountRef.current > 3) {
          seenRef.current.clear();
          clickCountRef.current = 1;
        }

        try {
          const excludeParam = seenRef.current.size > 0
            ? `&exclude=${encodeURIComponent([...seenRef.current].join(","))}`
            : "";
          const res = await fetch(`/api/restaurants?lat=${lat}&lng=${lng}${excludeParam}`);
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "서버 오류");
          const newList: Restaurant[] = data.restaurants ?? [];
          setRestaurants(newList);
          setTotalNearby(data.totalNearby ?? 0);
          newList.forEach((r) => seenRef.current.add(r.title));
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
    <div style={{
      minHeight: "100vh",
      background: "#F5F5F7",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Pretendard Variable', Pretendard, sans-serif",
      WebkitFontSmoothing: "antialiased",
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .apple-card {
          transition: all 0.6s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .apple-card:hover {
          transform: scale(1.02);
          box-shadow: 0 20px 60px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04);
        }
        .apple-btn {
          transition: all 0.6s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .apple-btn:hover {
          transform: scale(1.03);
          box-shadow: 0 8px 30px rgba(0,0,0,0.12);
        }
        .apple-btn:active {
          transform: scale(0.97);
        }
      `}</style>

      {/* 헤더 */}
      <header style={{
        padding: "72px 24px 56px",
        textAlign: "center",
        background: "linear-gradient(180deg, #1D1D1F 0%, #2C2C2E 100%)",
      }}>
        <p style={{ color: "#86868B", fontSize: 13, letterSpacing: "0.02em", margin: "0 0 12px", textTransform: "uppercase" }}>
          Lunch Pick Map
        </p>
        <h1 style={{
          color: "#F5F5F7",
          fontSize: "clamp(2.8rem, 10vw, 4rem)",
          fontWeight: 800,
          letterSpacing: "-0.04em",
          margin: "0 0 12px",
          lineHeight: 1.05,
        }}>
          점메추 지도
        </h1>
        <p style={{ color: "#86868B", fontSize: 15, margin: "0 0 36px", letterSpacing: "-0.01em" }}>
          오늘 점심, 지금 뽑기
        </p>

        <button
          className="apple-btn"
          onClick={recommend}
          disabled={isLoading}
          style={{
            background: isLoading ? "rgba(255,255,255,0.08)" : "#F05705",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 980,
            padding: "18px 48px",
            fontSize: 17,
            fontWeight: 600,
            cursor: isLoading ? "not-allowed" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            letterSpacing: "-0.02em",
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

      {/* 본문 */}
      <main style={{ maxWidth: 560, margin: "0 auto", padding: "32px 20px 60px" }}>

        {phase === "error" && (
          <div style={{
            background: "#FFF", borderRadius: 20, padding: "16px 20px",
            color: "#FF3B30", fontSize: 14, marginBottom: 20,
            boxShadow: "0 2px 12px rgba(255,59,48,0.08)",
          }}>
            {errorMsg}
          </div>
        )}

        {phase === "done" && restaurants.length > 0 && (
          <div style={{ animation: "fadeUp 0.6s cubic-bezier(0.25, 1, 0.5, 1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, color: "#86868B", fontSize: 13, letterSpacing: "-0.01em" }}>
              <MapPin size={13} />
              <span>500m 내 {totalNearby}곳 중 추천</span>
            </div>

            {/* 식당 카드 — 2x2 그리드 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {restaurants.map((r, i) => {
                const cat = CATEGORIES.find((c) => c.label === r.category) ?? CATEGORIES[0];
                const Icon = cat.icon;
                const dist = (r as unknown as Record<string, unknown>).distance as number | undefined;
                const href = r.link || `https://place.map.kakao.com/`;

                return (
                  <a key={i} href={href} target="_blank" rel="noopener noreferrer"
                    className="apple-card"
                    style={{
                      display: "flex", flexDirection: "column", background: "#FFFFFF", borderRadius: 20,
                      padding: "20px 16px",
                      textDecoration: "none", color: "inherit",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)",
                      border: "none",
                      position: "relative", overflow: "hidden",
                      animationDelay: `${i * 0.08}s`,
                    }}>

                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: cat.color + "10",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <Icon size={20} color={cat.color} strokeWidth={1.8} />
                      </div>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: cat.color, letterSpacing: "-0.01em" }}>{r.category}</span>
                        {dist != null && (
                          <span style={{ fontSize: 11, color: "#86868B", marginLeft: 6 }}>
                            도보 {Math.max(1, Math.round(dist / 67))}분
                          </span>
                        )}
                      </div>
                    </div>

                    <p style={{
                      fontWeight: 700, fontSize: 15, margin: "0 0 4px",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      letterSpacing: "-0.02em", color: "#1D1D1F",
                    }}>
                      {r.title}
                    </p>
                    {(r.roadAddress || r.address) && (
                      <p style={{
                        fontSize: 12, color: "#86868B", margin: 0,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        letterSpacing: "-0.01em",
                      }}>
                        {r.roadAddress || r.address}
                      </p>
                    )}

                    <div style={{ marginTop: "auto", paddingTop: 12, display: "flex", justifyContent: "flex-end" }}>
                      <ChevronRight size={14} color="#C7C7CC" />
                    </div>
                  </a>
                );
              })}
            </div>

            {userLocation && (
              <div style={{
                borderRadius: 20, overflow: "hidden", height: 280,
                boxShadow: "0 4px 16px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)",
              }}>
                <NaverMap restaurants={restaurants} userLocation={userLocation} categoryColors={restaurants.map(r => CATEGORIES.find(c => c.label === r.category)?.color ?? "#999")} />
              </div>
            )}

            <button
              className="apple-card"
              onClick={async () => {
                const lines = restaurants.map((r, i) => {
                  const dist = (r as unknown as Record<string, unknown>).distance as number | undefined;
                  const link = r.link || "";
                  return `${i + 1}. [${r.category}] ${r.title}${dist ? ` (${dist}m)` : ""}\n${link}`;
                }).join("\n\n");
                const fullText = `오늘 점심 뽑기 결과\n\n${lines}\n\n점메추 지도에서 뽑기\nhttps://jummechr.vercel.app`;
                if (navigator.share) {
                  try { await navigator.share({ text: fullText }); } catch {}
                } else {
                  await navigator.clipboard.writeText(fullText);
                  alert("결과가 복사됐어요! 붙여넣기로 공유하세요.");
                }
              }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                width: "100%", marginTop: 16, padding: "14px 0",
                background: "#F05705", border: "none", borderRadius: 16,
                fontSize: 14, fontWeight: 600, color: "#FFFFFF", cursor: "pointer",
                boxShadow: "0 4px 16px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)",
                letterSpacing: "-0.02em",
              }}
            >
              <Share2 size={15} />결과 공유하기
            </button>
          </div>
        )}

        {/* SEO 콘텐츠 */}
        <article style={{ marginTop: phase === "idle" ? 32 : 48, display: "flex", flexDirection: "column", gap: 16 }}>
          <section style={{
            padding: "28px 24px", borderRadius: 20, background: "#FFFFFF",
            boxShadow: "0 4px 16px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)",
          }}>
            <h2 style={{ fontWeight: 700, fontSize: 17, margin: "0 0 10px", color: "#1D1D1F", letterSpacing: "-0.02em" }}>
              점메추 지도 — 점심 메뉴 추천 서비스
            </h2>
            <p style={{ fontSize: 14, color: "#86868B", lineHeight: 1.8, margin: 0, letterSpacing: "-0.01em" }}>
              <strong style={{ color: "#1D1D1F" }}>점메추</strong>는 &lsquo;점심 메뉴 추천&rsquo;의 줄임말이에요.
              매일 &ldquo;오늘 점심 뭐 먹지?&rdquo; 고민하는 직장인을 위해 만들었어요.
              버튼 한 번이면 내 위치 500m 이내 맛집 4곳을 <strong style={{ color: "#1D1D1F" }}>한식·중식·일식·양식</strong> 각각 다른 카테고리로 골라드립니다.
              마음에 안 들면 다시 뽑기 — 매번 다른 가게가 나와요.
            </p>
          </section>

          <section style={{
            padding: "28px 24px", borderRadius: 20, background: "#FFFFFF",
            boxShadow: "0 4px 16px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)",
          }}>
            <h2 style={{ fontWeight: 700, fontSize: 17, margin: "0 0 10px", color: "#1D1D1F", letterSpacing: "-0.02em" }}>
              이런 분들에게 추천해요
            </h2>
            <ul style={{ fontSize: 14, color: "#86868B", lineHeight: 2.2, margin: 0, paddingLeft: 18, letterSpacing: "-0.01em" }}>
              <li>매일 점심 메뉴 고르기 지치는 직장인</li>
              <li>회사 근처 새로운 맛집을 발견하고 싶은 분</li>
              <li>점심시간 1시간 안에 식사하고 돌아와야 하는 분</li>
              <li>한식만 먹다가 중식·일식·양식도 먹어보고 싶은 분</li>
            </ul>
          </section>

          <section style={{
            padding: "28px 24px", borderRadius: 20, background: "#FFFFFF",
            boxShadow: "0 4px 16px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)",
          }}>
            <h2 style={{ fontWeight: 700, fontSize: 17, margin: "0 0 10px", color: "#1D1D1F", letterSpacing: "-0.02em" }}>
              점메추 지도 사용법
            </h2>
            <ol style={{ fontSize: 14, color: "#86868B", lineHeight: 2.2, margin: 0, paddingLeft: 18, letterSpacing: "-0.01em" }}>
              <li><strong style={{ color: "#1D1D1F" }}>뽑기 시작</strong> 버튼을 눌러주세요</li>
              <li>위치 권한을 허용하면 자동으로 내 주변을 검색해요</li>
              <li>한식·중식·일식·양식 4곳이 추천돼요</li>
              <li>카드를 누르면 카카오맵에서 상세 정보를 볼 수 있어요</li>
              <li>마음에 안 들면 <strong style={{ color: "#1D1D1F" }}>다시 뽑기</strong> — 다른 가게가 나와요</li>
            </ol>
          </section>
        </article>
      </main>

      <footer style={{ textAlign: "center", paddingBottom: 40, fontSize: 12, color: "#86868B", letterSpacing: "-0.01em" }}>
        점메추 지도 · 위치 정보는 저장되지 않아요
      </footer>
    </div>
  );
}
