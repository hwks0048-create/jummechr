import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageShell, { Card, H2, Body, Chip, CtaLink } from "@/components/PageShell";
import MenuLinkGrid from "@/components/MenuLinkGrid";
import { MENUS, MENU_BY_SLUG, CATEGORY_COLORS } from "@/lib/menus";
import { SITUATION_BY_SLUG } from "@/lib/situations";

const SITE_URL = "https://jummechr.vercel.app";

export function generateStaticParams() {
  return MENUS.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const menu = MENU_BY_SLUG[slug];
  if (!menu) return {};
  const title = `오늘 점심 ${menu.name} 어때요? 내 주변 ${menu.name} 맛집 찾기`;
  const description = `${menu.tagline}. ${menu.why.split(". ")[0]}. 내 위치 500m 안에서 ${menu.name} 파는 집을 바로 찾아드려요.`;
  return {
    title,
    description,
    alternates: { canonical: `/menu/${menu.slug}` },
    openGraph: { title, description, url: `${SITE_URL}/menu/${menu.slug}` },
  };
}

export default async function MenuPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const menu = MENU_BY_SLUG[slug];
  if (!menu) notFound();

  const color = CATEGORY_COLORS[menu.category];
  const situations = menu.tags.map((t) => SITUATION_BY_SLUG[t]).filter(Boolean);
  const related = MENUS.filter((m) => m.category === menu.category && m.slug !== menu.slug).slice(0, 4);
  const findHref = `/?menu=${menu.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `오늘 점심 ${menu.name} 어때요?`,
    description: menu.tagline,
    inLanguage: "ko",
    author: { "@type": "Organization", name: "점메추 지도" },
    publisher: { "@type": "Organization", name: "점메추 지도" },
    mainEntityOfPage: `${SITE_URL}/menu/${menu.slug}`,
    about: { "@type": "Thing", name: menu.name },
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "점메추 지도", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "점심 메뉴", item: `${SITE_URL}/menu` },
      { "@type": "ListItem", position: 3, name: menu.name, item: `${SITE_URL}/menu/${menu.slug}` },
    ],
  };

  return (
    <PageShell
      eyebrow={`${menu.category} · 점심 메뉴 추천`}
      title={<><span style={{ fontSize: "1.2em" }}>{menu.emoji}</span> 오늘 점심 {menu.name} 어때요?</>}
      subtitle={menu.tagline}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <CtaLink href={findHref}>📍 내 주변 {menu.name} 파는 집 찾기</CtaLink>

      <Card>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color, background: color + "14", padding: "5px 10px", borderRadius: 980 }}>{menu.category}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#515154", background: "#F5F5F7", padding: "5px 10px", borderRadius: 980 }}>💰 {menu.price}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#515154", background: "#F5F5F7", padding: "5px 10px", borderRadius: 980 }}>⏱ 약 {menu.time}</span>
        </div>
        <H2>왜 점심으로 {menu.name}인가요?</H2>
        <Body>{menu.why}</Body>
      </Card>

      <Card>
        <H2>주문 팁</H2>
        <Body>{menu.tip}</Body>
      </Card>

      {situations.length > 0 && (
        <Card>
          <H2>이런 날 특히 좋아요</H2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
            {situations.map((s) => (
              <Chip key={s.slug} href={`/situation/${s.slug}`}>{s.emoji} {s.label}</Chip>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <H2>내 주변 {menu.name} 맛집은 어떻게 찾나요?</H2>
        <Body>
          위 버튼을 누르고 위치 권한을 허용하면 현재 위치 500m 이내에서 {menu.name}을(를) 파는 가게를 가까운 순으로 최대 4곳 보여드려요.
          500m 안에 없으면 1km까지 넓혀서 찾아요. 가게를 누르면 카카오맵에서 영업시간·리뷰를 확인할 수 있어요.
        </Body>
      </Card>

      <CtaLink href={findHref}>📍 내 주변 {menu.name} 파는 집 찾기</CtaLink>

      {related.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h2 style={{ fontWeight: 700, fontSize: 17, margin: "12px 0 0", color: "#1D1D1F", letterSpacing: "-0.02em" }}>
            다른 {menu.category} 점심 메뉴
          </h2>
          <MenuLinkGrid menus={related} showCategory={false} />
        </div>
      )}

      <Chip href="/menu">전체 메뉴 보기 →</Chip>
    </PageShell>
  );
}
