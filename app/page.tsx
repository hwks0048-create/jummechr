"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { MapPin, RotateCcw, Shuffle, ChevronRight, Soup, Fish, Sandwich, Beef, Share2, Dices, ArrowRight } from "lucide-react";
import type { Restaurant } from "@/components/NaverMap";
import { MENUS, MENU_BY_SLUG, CATEGORY_COLORS, randomMenu, type Menu, type Category } from "@/lib/menus";
import { SITUATIONS } from "@/lib/situations";
import { track } from "@/lib/track";

const NaverMap = dynamic(() => import("@/components/NaverMap"), { ssr: false });

type Phase = "idle" | "locating" | "fetching" | "done" | "error";
type Roulette = "idle" | "spinning" | "picked";

const BRAND = "#F05705";
const CARD_SHADOW = "0 4px 16px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)";
const SITE_URL = "https://jummechr.vercel.app";

const CATEGORIES: Array<{ icon: typeof Soup; color: string; label: Category }> = [
  { icon: Soup,     color: CATEGORY_COLORS.한식, label: "한식" },
  { icon: Beef,     color: CATEGORY_COLORS.중식, label: "중식" },
  { icon: Fish,     color: CATEGORY_COLORS.일식, label: "일식" },
  { icon: Sandwich, color: CATEGORY_COLORS.양식, label: "양식" },
];

// 룰렛 틱 간격 — 빠르게 돌다가 천천히 멈춤
const SPIN_DELAYS = [50, 50, 50, 50, 60, 60, 70, 80, 90, 110, 140, 180, 240, 320];

export default function Home() {
  // ── 메뉴 룰렛 ──
  const [roulette, setRoulette] = useState<Roulette>("idle");
  const [picked, setPicked] = useState<Menu | null>(null);
  const [spinFace, setSpinFace] = useState<Menu>(MENUS[0]);
  const lastPickRef = useRef<string | undefined>(undefined);

  // ── 가게 탐색 ──
  const [phase, setPhase] = useState<Phase>("idle");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>();
  const [totalNearby, setTotalNearby] = useState(0);
  const [searchRadius, setSearchRadius] = useState(500);
  const [searchMenu, setSearchMenu] = useState<Menu | null>(null); // null = 4카테고리 모드
  const [errorMsg, setErrorMsg] = useState("");
  const seenRef = useRef<Set<string>>(new Set());
  const clickCountRef = useRef(0);
  const resultRef = useRef<HTMLDivElement>(null);

  // /?menu=slug 로 들어오면 (메뉴 페이지 CTA) 해당 메뉴를 바로 띄움
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("menu");
    if (slug && MENU_BY_SLUG[slug]) {
      const m = MENU_BY_SLUG[slug];
      setPicked(m);
      setSpinFace(m);
      setRoulette("picked");
      lastPickRef.current = m.slug;
      track("menu_deeplink", { menu: m.name });
    }
  }, []);

  function spin() {
    if (roulette === "spinning") return;
    setRoulette("spinning");
    setPhase("idle");
    setRestaurants([]);
    const target = randomMenu(lastPickRef.current);
    let i = 0;
    const tick = () => {
      if (i < SPIN_DELAYS.length) {
        setSpinFace(MENUS[Math.floor(Math.random() * MENUS.length)]);
        setTimeout(tick, SPIN_DELAYS[i]);
        i += 1;
      } else {
        setSpinFace(target);
        setPicked(target);
        lastPickRef.current = target.slug;
        setRoulette("picked");
        track("roulette_spin", { menu: target.name, category: target.category });
      }
    };
    tick();
  }

  const locate = useCallback((onOk: (lat: number, lng: number) => void) => {
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
      (pos) => onOk(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        setErrorMsg(err.code === err.PERMISSION_DENIED ? "위치 권한을 허용해주세요." : "위치를 가져올 수 없어요.");
        setPhase("error");
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  async function fetchRestaurants(lat: number, lng: number, menu: Menu | null) {
    setUserLocation({ lat, lng });
    setPhase("fetching");
    clickCountRef.current += 1;
    if (clickCountRef.current > 3) {
      seenRef.current.clear();
      clickCountRef.current = 1;
    }
    try {
      const excludeParam = seenRef.current.size > 0 ? `&exclude=${encodeURIComponent([...seenRef.current].join(","))}` : "";
      const menuParam = menu ? `&menu=${menu.slug}` : "";
      const res = await fetch(`/api/restaurants?lat=${lat}&lng=${lng}${excludeParam}${menuParam}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "서버 오류");
      const newList: Restaurant[] = data.restaurants ?? [];
      setRestaurants(newList);
      setTotalNearby(data.totalNearby ?? 0);
      setSearchRadius(data.radius ?? 500);
      newList.forEach((r) => seenRef.current.add(r.title));
      setPhase("done");
      track(menu ? "find_nearby_menu" : "find_nearby_random", { menu: menu?.name ?? "", results: newList.length });
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "오류가 발생했어요.");
      setPhase("error");
    }
  }

  /** 룰렛 결과 → 내 주변 이 메뉴 파는 집 */
  function findByMenu(menu: Menu) {
    setSearchMenu(menu);
    seenRef.current.clear();
    clickCountRef.current = 0;
    locate((lat, lng) => fetchRestaurants(lat, lng, menu));
  }

  /** 메뉴 말고 가게로 바로 (기존 4카테고리 모드) */
  function findRandom() {
    if (searchMenu) { seenRef.current.clear(); clickCountRef.current = 0; }
    setSearchMenu(null);
    locate((lat, lng) => fetchRestaurants(lat, lng, null));
  }

  function retry() {
    if (userLocation) fetchRestaurants(userLocation.lat, userLocation.lng, searchMenu);
    else if (searchMenu) findByMenu(searchMenu);
    else findRandom();
  }

  const isLoading = phase === "locating" || phase === "fetching";
  const faceColor = CATEGORY_COLORS[spinFace.category];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F5F5F7",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Pretendard Variable', Pretendard, sans-serif",
      WebkitFontSmoothing: "antialiased",
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pop { 0% { transform: scale(0.92); } 60% { transform: scale(1.04); } 100% { transform: scale(1); } }
        .apple-card { transition: all 0.6s cubic-bezier(0.25, 1, 0.5, 1); }
        .apple-card:hover { transform: scale(1.02); box-shadow: 0 20px 60px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04); }
        .apple-btn { transition: all 0.6s cubic-bezier(0.25, 1, 0.5, 1); }
        .apple-btn:hover { transform: scale(1.03); box-shadow: 0 8px 30px rgba(0,0,0,0.12); }
        .apple-btn:active { transform: scale(0.97); }
        .ghost-btn { background: transparent; border: none; color: #A1A1A6; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; letter-spacing: -0.01em; padding: 8px 12px; border-radius: 980px; transition: color .2s; }
        .ghost-btn:hover { color: #F5F5F7; }
        .pick-face { animation: pop 0.5s cubic-bezier(0.25, 1, 0.5, 1); }
      `}</style>

      {/* 헤더 + 룰렛 */}
      <header style={{
        padding: "60px 24px 48px",
        textAlign: "center",
        background: "linear-gradient(180deg, #1D1D1F 0%, #2C2C2E 100%)",
      }}>
        <p style={{ color: "#86868B", fontSize: 13, letterSpacing: "0.02em", margin: "0 0 12px", textTransform: "uppercase" }}>
          Lunch Pick Map
        </p>
        <h1 style={{
          color: "#F5F5F7",
          fontSize: "clamp(2.4rem, 9vw, 3.6rem)",
          fontWeight: 800,
          letterSpacing: "-0.04em",
          margin: "0 0 8px",
          lineHeight: 1.05,
        }}>
          점메추 지도
        </h1>
        <p style={{ color: "#86868B", fontSize: 15, margin: "0 0 28px", letterSpacing: "-0.01em" }}>
          오늘 점심 뭐 먹지? 메뉴부터 뽑고, 근처 가게까지
        </p>

        {/* 룰렛 디스플레이 */}
        <div
          className={roulette === "picked" ? "pick-face" : undefined}
          key={roulette === "picked" ? picked?.slug : "spin"}
          style={{
            margin: "0 auto 20px", maxWidth: 360,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 24, padding: roulette === "idle" ? "22px 20px" : "26px 20px 22px",
          }}
        >
          {roulette === "idle" ? (
            <p style={{ color: "#A1A1A6", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
              위치 권한 없이 바로 돼요.<br />
              <span style={{ color: "#F5F5F7", fontWeight: 600 }}>{MENUS.length}가지 점심 메뉴</span> 중 하나를 뽑아드려요.
            </p>
          ) : (
            <>
              <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 10 }}>{spinFace.emoji}</div>
              <div style={{ color: "#F5F5F7", fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                {spinFace.name}
              </div>
              <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: faceColor }}>{spinFace.category}</div>
              {roulette === "picked" && picked && (
                <p style={{ color: "#A1A1A6", fontSize: 13, margin: "10px 0 0", lineHeight: 1.5, letterSpacing: "-0.01em" }}>
                  {picked.tagline}
                </p>
              )}
            </>
          )}
        </div>

        {/* 버튼 영역 */}
        {roulette !== "picked" ? (
          <button
            className="apple-btn"
            onClick={spin}
            disabled={roulette === "spinning"}
            style={{
              background: roulette === "spinning" ? "rgba(255,255,255,0.08)" : BRAND,
              color: "#FFFFFF", border: "none", borderRadius: 980,
              padding: "18px 44px", fontSize: 17, fontWeight: 600,
              cursor: roulette === "spinning" ? "not-allowed" : "pointer",
              display: "inline-flex", alignItems: "center", gap: 10, letterSpacing: "-0.02em",
            }}
          >
            {roulette === "spinning"
              ? <><Dices size={18} style={{ animation: "spin .6s linear infinite" }} />뽑는 중&hellip;</>
              : <><Dices size={18} />메뉴 뽑기</>}
          </button>
        ) : picked && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <button
              className="apple-btn"
              onClick={() => findByMenu(picked)}
              disabled={isLoading}
              style={{
                background: isLoading ? "rgba(255,255,255,0.08)" : BRAND,
                color: "#FFFFFF", border: "none", borderRadius: 980,
                padding: "18px 36px", fontSize: 17, fontWeight: 600,
                cursor: isLoading ? "not-allowed" : "pointer",
                display: "inline-flex", alignItems: "center", gap: 10, letterSpacing: "-0.02em",
              }}
            >
              {isLoading && searchMenu
                ? <><Shuffle size={18} style={{ animation: "spin .8s linear infinite" }} />{phase === "locating" ? "위치 확인 중" : "탐색 중"}&hellip;</>
                : <><MapPin size={18} />내 주변 {picked.name} 파는 집 찾기</>}
            </button>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
              <button className="ghost-btn" onClick={spin} disabled={roulette !== "picked"}>
                <RotateCcw size={13} />다른 메뉴 뽑기
              </button>
              <Link href={`/menu/${picked.slug}`} className="ghost-btn" style={{ textDecoration: "none" }}>
                {picked.name} 자세히<ArrowRight size={13} />
              </Link>
            </div>
          </div>
        )}

        {/* 기존 4카테고리 모드 진입 */}
        <div style={{ marginTop: 22 }}>
          <button className="ghost-btn" onClick={findRandom} disabled={isLoading}>
            {isLoading && !searchMenu
              ? <><Shuffle size={13} style={{ animation: "spin .8s linear infinite" }} />{phase === "locating" ? "위치 확인 중" : "탐색 중"}&hellip;</>
              : <><MapPin size={13} />메뉴 말고 근처 가게로 바로 뽑기 (한·중·일·양 4곳)</>}
          </button>
        </div>
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

        {phase === "done" && restaurants.length === 0 && (
          <div ref={resultRef} style={{ background: "#FFF", borderRadius: 20, padding: "20px", marginBottom: 20, boxShadow: CARD_SHADOW, textAlign: "center" }}>
            <p style={{ margin: "0 0 12px", fontSize: 14, color: "#1D1D1F", letterSpacing: "-0.01em" }}>
              근처 1km 안에 {searchMenu?.name ?? "식당"}을(를) 파는 집을 못 찾았어요.
            </p>
            <button className="apple-btn" onClick={spin} style={{ background: BRAND, color: "#FFF", border: "none", borderRadius: 980, padding: "12px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              다른 메뉴 뽑기
            </button>
          </div>
        )}

        {phase === "done" && restaurants.length > 0 && (
          <div ref={resultRef} style={{ animation: "fadeUp 0.6s cubic-bezier(0.25, 1, 0.5, 1)", scrollMarginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#86868B", fontSize: 13, letterSpacing: "-0.01em" }}>
                <MapPin size={13} />
                <span>
                  {searchMenu
                    ? `${searchRadius}m 내 ${searchMenu.name} ${totalNearby}곳 중 가까운 순`
                    : `500m 내 ${totalNearby}곳 중 추천`}
                </span>
              </div>
              <button
                onClick={retry}
                disabled={isLoading}
                style={{ background: "transparent", border: "none", color: BRAND, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, padding: 0 }}
              >
                <RotateCcw size={13} />다시 뽑기
              </button>
            </div>

            {/* 식당 카드 — 2x2 그리드 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {restaurants.map((r, i) => {
                const cat = CATEGORIES.find((c) => c.label === r.category) ?? CATEGORIES[0];
                const Icon = cat.icon;
                const dist = r.distance;
                const href = r.link || `https://place.map.kakao.com/`;

                return (
                  <a key={i} href={href} target="_blank" rel="noopener noreferrer"
                    className="apple-card"
                    onClick={() => track("restaurant_click", { menu: searchMenu?.name ?? "", category: r.category })}
                    style={{
                      display: "flex", flexDirection: "column", background: "#FFFFFF", borderRadius: 20,
                      padding: "20px 16px",
                      textDecoration: "none", color: "inherit",
                      boxShadow: CARD_SHADOW,
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
                        {searchMenu
                          ? <span style={{ fontSize: 20, lineHeight: 1 }}>{searchMenu.emoji}</span>
                          : <Icon size={20} color={cat.color} strokeWidth={1.8} />}
                      </div>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: cat.color, letterSpacing: "-0.01em" }}>{searchMenu ? searchMenu.name : r.category}</span>
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
                boxShadow: CARD_SHADOW,
              }}>
                <NaverMap restaurants={restaurants} userLocation={userLocation} categoryColors={restaurants.map(r => CATEGORIES.find(c => c.label === r.category)?.color ?? "#999")} />
              </div>
            )}

            <button
              className="apple-card"
              onClick={async () => {
                const lines = restaurants.map((r, i) => {
                  const dist = r.distance;
                  const link = r.link || "";
                  return `${i + 1}. [${r.category}] ${r.title}${dist ? ` (${dist}m)` : ""}\n${link}`;
                }).join("\n\n");
                const head = searchMenu ? `오늘 점심은 ${searchMenu.emoji} ${searchMenu.name}!\n근처 ${searchMenu.name} 파는 집` : "오늘 점심 뽑기 결과";
                const fullText = `${head}\n\n${lines}\n\n점메추 지도에서 뽑기\n${SITE_URL}${searchMenu ? `/menu/${searchMenu.slug}` : ""}`;
                track("share", { menu: searchMenu?.name ?? "" });
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
                background: BRAND, border: "none", borderRadius: 16,
                fontSize: 14, fontWeight: 600, color: "#FFFFFF", cursor: "pointer",
                boxShadow: CARD_SHADOW,
                letterSpacing: "-0.02em",
              }}
            >
              <Share2 size={15} />결과 공유하기
            </button>
          </div>
        )}

        {/* SEO 콘텐츠 + 내부 링크 */}
        <article style={{ marginTop: phase === "idle" ? 0 : 40, display: "flex", flexDirection: "column", gap: 16 }}>

          <section style={{ padding: "28px 24px", borderRadius: 20, background: "#FFFFFF", boxShadow: CARD_SHADOW }}>
            <h2 style={{ fontWeight: 700, fontSize: 17, margin: "0 0 12px", color: "#1D1D1F", letterSpacing: "-0.02em" }}>
              상황별 점심 메뉴 추천
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {SITUATIONS.map((s) => (
                <Link key={s.slug} href={`/situation/${s.slug}`} style={{
                  display: "inline-flex", alignItems: "center", gap: 4, padding: "8px 14px", borderRadius: 980,
                  background: "#F5F5F7", color: "#1D1D1F", fontSize: 13, fontWeight: 600, textDecoration: "none", letterSpacing: "-0.01em",
                }}>
                  {s.emoji} {s.label}
                </Link>
              ))}
            </div>
          </section>

          <section style={{ padding: "28px 24px", borderRadius: 20, background: "#FFFFFF", boxShadow: CARD_SHADOW }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
              <h2 style={{ fontWeight: 700, fontSize: 17, margin: 0, color: "#1D1D1F", letterSpacing: "-0.02em" }}>
                메뉴별 점심 추천
              </h2>
              <Link href="/menu" style={{ fontSize: 13, color: BRAND, fontWeight: 600, textDecoration: "none" }}>전체 보기 →</Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px" }}>
              {CATEGORIES.map((c) => (
                <div key={c.label}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: c.color, margin: "8px 0 4px" }}>{c.label}</p>
                  {MENUS.filter((m) => m.category === c.label).map((m) => (
                    <Link key={m.slug} href={`/menu/${m.slug}`} style={{
                      display: "block", fontSize: 14, color: "#1D1D1F", textDecoration: "none", padding: "4px 0", letterSpacing: "-0.01em",
                    }}>
                      {m.emoji} {m.name}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </section>

          <section style={{ padding: "28px 24px", borderRadius: 20, background: "#FFFFFF", boxShadow: CARD_SHADOW }}>
            <h2 style={{ fontWeight: 700, fontSize: 17, margin: "0 0 10px", color: "#1D1D1F", letterSpacing: "-0.02em" }}>
              점메추 지도 — 점심 메뉴 추천 서비스
            </h2>
            <p style={{ fontSize: 14, color: "#515154", lineHeight: 1.8, margin: 0, letterSpacing: "-0.01em" }}>
              <strong style={{ color: "#1D1D1F" }}>점메추</strong>는 &lsquo;점심 메뉴 추천&rsquo;의 줄임말이에요.
              매일 &ldquo;오늘 점심 뭐 먹지?&rdquo; 고민하는 직장인을 위해 만들었어요.
              <strong style={{ color: "#1D1D1F" }}>메뉴 뽑기</strong>는 위치 권한 없이 {MENUS.length}가지 점심 메뉴 중 하나를 룰렛으로 골라주고,
              마음에 들면 <strong style={{ color: "#1D1D1F" }}>내 주변 500m 안에서 그 메뉴를 파는 집</strong>까지 바로 찾아드려요.
              메뉴 고르기도 귀찮으면 한식·중식·일식·양식 가게 4곳을 한 번에 뽑을 수도 있어요.
            </p>
          </section>

          <section style={{ padding: "28px 24px", borderRadius: 20, background: "#FFFFFF", boxShadow: CARD_SHADOW }}>
            <h2 style={{ fontWeight: 700, fontSize: 17, margin: "0 0 10px", color: "#1D1D1F", letterSpacing: "-0.02em" }}>
              이런 분들에게 추천해요
            </h2>
            <ul style={{ fontSize: 14, color: "#515154", lineHeight: 2.2, margin: 0, paddingLeft: 18, letterSpacing: "-0.01em" }}>
              <li>매일 점심 메뉴 고르기 지치는 직장인</li>
              <li>회사 근처 새로운 맛집을 발견하고 싶은 분</li>
              <li>점심시간 1시간 안에 식사하고 돌아와야 하는 분</li>
              <li>한식만 먹다가 중식·일식·양식도 먹어보고 싶은 분</li>
            </ul>
          </section>

          <section style={{ padding: "28px 24px", borderRadius: 20, background: "#FFFFFF", boxShadow: CARD_SHADOW }}>
            <h2 style={{ fontWeight: 700, fontSize: 17, margin: "0 0 10px", color: "#1D1D1F", letterSpacing: "-0.02em" }}>
              점메추 지도 사용법
            </h2>
            <ol style={{ fontSize: 14, color: "#515154", lineHeight: 2.2, margin: 0, paddingLeft: 18, letterSpacing: "-0.01em" }}>
              <li><strong style={{ color: "#1D1D1F" }}>메뉴 뽑기</strong>를 누르면 점심 메뉴 하나가 뽑혀요 (위치 권한 불필요)</li>
              <li>마음에 안 들면 <strong style={{ color: "#1D1D1F" }}>다른 메뉴 뽑기</strong></li>
              <li><strong style={{ color: "#1D1D1F" }}>내 주변 파는 집 찾기</strong>를 누르고 위치 권한을 허용하면 500m 안 가게가 가까운 순으로 나와요</li>
              <li>카드를 누르면 카카오맵에서 영업시간·리뷰를 볼 수 있어요</li>
              <li>결과는 <strong style={{ color: "#1D1D1F" }}>공유하기</strong>로 동료에게 바로 보낼 수 있어요</li>
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
