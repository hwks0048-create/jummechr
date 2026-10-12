import Link from "next/link";
import { CATEGORY_COLORS, type Menu } from "@/lib/menus";
import { CARD_SHADOW } from "./PageShell";

/** 메뉴 카드 링크 목록 (2열) */
export default function MenuLinkGrid({ menus, showCategory = true }: { menus: Menu[]; showCategory?: boolean }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {menus.map((m) => {
        const color = CATEGORY_COLORS[m.category];
        return (
          <Link
            key={m.slug}
            href={`/menu/${m.slug}`}
            className="apple-btn"
            style={{
              display: "flex", flexDirection: "column", gap: 6,
              background: "#FFF", borderRadius: 18, padding: "18px 16px",
              textDecoration: "none", color: "inherit", boxShadow: CARD_SHADOW,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 22, lineHeight: 1 }}>{m.emoji}</span>
              {showCategory && (
                <span style={{ fontSize: 11, fontWeight: 600, color, letterSpacing: "-0.01em" }}>{m.category}</span>
              )}
            </div>
            <p style={{ fontWeight: 700, fontSize: 15, margin: 0, color: "#1D1D1F", letterSpacing: "-0.02em" }}>{m.name}</p>
            <p style={{ fontSize: 12, color: "#86868B", margin: 0, lineHeight: 1.5, letterSpacing: "-0.01em",
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {m.tagline}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
