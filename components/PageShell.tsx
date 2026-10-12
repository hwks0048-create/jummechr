import Link from "next/link";
import type { ReactNode } from "react";

export const FONT = "-apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Pretendard Variable', Pretendard, sans-serif";
export const CARD_SHADOW = "0 4px 16px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)";
export const BRAND = "#F05705";

export function Card({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <section style={{ padding: "28px 24px", borderRadius: 20, background: "#FFFFFF", boxShadow: CARD_SHADOW, ...style }}>
      {children}
    </section>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return (
    <h2 style={{ fontWeight: 700, fontSize: 17, margin: "0 0 10px", color: "#1D1D1F", letterSpacing: "-0.02em" }}>
      {children}
    </h2>
  );
}

export function Body({ children }: { children: ReactNode }) {
  return (
    <p style={{ fontSize: 14, color: "#515154", lineHeight: 1.8, margin: 0, letterSpacing: "-0.01em" }}>
      {children}
    </p>
  );
}

/** 주황 CTA 버튼(링크) */
export function CtaLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="apple-btn"
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        width: "100%", padding: "16px 20px",
        background: BRAND, color: "#FFF", textDecoration: "none",
        borderRadius: 16, fontSize: 15, fontWeight: 600, letterSpacing: "-0.02em",
        boxShadow: CARD_SHADOW,
      }}
    >
      {children}
    </Link>
  );
}

/** 작은 칩 링크 */
export function Chip({ href, children, color }: { href: string; children: ReactNode; color?: string }) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "8px 14px", borderRadius: 980,
        background: color ? color + "14" : "#F5F5F7",
        color: color ?? "#1D1D1F",
        fontSize: 13, fontWeight: 600, textDecoration: "none", letterSpacing: "-0.01em",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </Link>
  );
}

export default function PageShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", background: "#F5F5F7", fontFamily: FONT, WebkitFontSmoothing: "antialiased" }}>
      <style>{`
        .apple-btn { transition: all 0.6s cubic-bezier(0.25, 1, 0.5, 1); }
        .apple-btn:hover { transform: scale(1.03); box-shadow: 0 8px 30px rgba(0,0,0,0.12); }
        .apple-btn:active { transform: scale(0.97); }
      `}</style>

      <header style={{ padding: "56px 24px 44px", textAlign: "center", background: "linear-gradient(180deg, #1D1D1F 0%, #2C2C2E 100%)" }}>
        <Link href="/" style={{ color: "#86868B", fontSize: 13, letterSpacing: "0.02em", textDecoration: "none", textTransform: "uppercase" }}>
          {eyebrow ?? "점메추 지도"}
        </Link>
        <h1 style={{
          color: "#F5F5F7", fontSize: "clamp(1.9rem, 7vw, 2.6rem)", fontWeight: 800,
          letterSpacing: "-0.04em", margin: "12px 0 10px", lineHeight: 1.15,
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ color: "#A1A1A6", fontSize: 15, margin: 0, letterSpacing: "-0.01em", lineHeight: 1.6, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
            {subtitle}
          </p>
        )}
      </header>

      <main style={{ maxWidth: 560, margin: "0 auto", padding: "28px 20px 60px", display: "flex", flexDirection: "column", gap: 16 }}>
        {children}
      </main>

      <footer style={{ textAlign: "center", paddingBottom: 40, fontSize: 12, color: "#86868B", letterSpacing: "-0.01em" }}>
        <Link href="/" style={{ color: "#86868B", textDecoration: "none" }}>점메추 지도</Link>
        {" · "}
        <Link href="/menu" style={{ color: "#86868B", textDecoration: "none" }}>전체 메뉴</Link>
        {" · 위치 정보는 저장되지 않아요"}
      </footer>
    </div>
  );
}
