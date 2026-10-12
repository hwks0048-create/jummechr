import type { Metadata } from "next";
import PageShell, { Card, H2, Body, Chip, CtaLink } from "@/components/PageShell";
import MenuLinkGrid from "@/components/MenuLinkGrid";
import { MENUS, CATEGORY_COLORS, type Category } from "@/lib/menus";
import { SITUATIONS } from "@/lib/situations";

export const metadata: Metadata = {
  title: "점심 메뉴 추천 리스트 — 한식·중식·일식·양식 32가지",
  description:
    "오늘 점심 뭐 먹지? 직장인 점심 메뉴 32가지를 한식·중식·일식·양식으로 정리했어요. 메뉴를 고르면 내 주변 500m 안에서 파는 집을 바로 찾아드려요.",
  alternates: { canonical: "/menu" },
  openGraph: {
    title: "점심 메뉴 추천 리스트 — 점메추 지도",
    description: "직장인 점심 메뉴 32가지. 메뉴를 고르면 내 주변에서 파는 집을 바로 찾아드려요.",
    url: "https://jummechr.vercel.app/menu",
  },
};

const CATEGORIES: Category[] = ["한식", "중식", "일식", "양식"];

export default function MenuIndexPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "직장인 점심 메뉴 추천 리스트",
    numberOfItems: MENUS.length,
    itemListElement: MENUS.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: m.name,
      url: `https://jummechr.vercel.app/menu/${m.slug}`,
    })),
  };

  return (
    <PageShell
      title="점심 메뉴 추천 리스트"
      subtitle="직장인 점심 메뉴 32가지. 메뉴를 고르면 내 주변에서 파는 집을 바로 찾아드려요."
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <CtaLink href="/">🎲 고민되면 메뉴 룰렛 돌리기</CtaLink>

      <Card>
        <H2>상황별로 고르기</H2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
          {SITUATIONS.map((s) => (
            <Chip key={s.slug} href={`/situation/${s.slug}`}>{s.emoji} {s.label}</Chip>
          ))}
        </div>
      </Card>

      {CATEGORIES.map((cat) => (
        <div key={cat} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h2 style={{ fontWeight: 700, fontSize: 17, margin: "12px 0 0", color: CATEGORY_COLORS[cat], letterSpacing: "-0.02em" }}>
            {cat} 점심 메뉴
          </h2>
          <MenuLinkGrid menus={MENUS.filter((m) => m.category === cat)} showCategory={false} />
        </div>
      ))}

      <Card>
        <H2>점메추 지도는 이렇게 써요</H2>
        <Body>
          메뉴 페이지에서 <strong style={{ color: "#1D1D1F" }}>내 주변 파는 집 찾기</strong>를 누르면 위치 권한을 허용한 뒤
          500m 이내(없으면 1km) 가게를 가까운 순으로 보여드려요. 가게 정보는 카카오맵에서 실시간으로 가져오고 저장하지 않아요.
        </Body>
      </Card>
    </PageShell>
  );
}
