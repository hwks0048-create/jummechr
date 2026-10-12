import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell, { Card, H2, Body, Chip, CtaLink, CARD_SHADOW, BRAND } from "@/components/PageShell";
import { CATEGORY_COLORS } from "@/lib/menus";
import { SITUATIONS, SITUATION_BY_SLUG, menusForSituation } from "@/lib/situations";

const SITE_URL = "https://jummechr.vercel.app";

export function generateStaticParams() {
  return SITUATIONS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = SITUATION_BY_SLUG[slug];
  if (!s) return {};
  return {
    title: s.title,
    description: s.description,
    alternates: { canonical: `/situation/${s.slug}` },
    openGraph: { title: `${s.title} — 점메추 지도`, description: s.description, url: `${SITE_URL}/situation/${s.slug}` },
  };
}

export default async function SituationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = SITUATION_BY_SLUG[slug];
  if (!s) notFound();

  const menus = menusForSituation(s.slug);
  const others = SITUATIONS.filter((x) => x.slug !== s.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: s.title,
    description: s.description,
    numberOfItems: menus.length,
    itemListElement: menus.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: m.name,
      url: `${SITE_URL}/menu/${m.slug}`,
    })),
  };

  return (
    <PageShell eyebrow="상황별 점심 메뉴 추천" title={<>{s.emoji} {s.title}</>} subtitle={s.intro}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {menus.map((m, i) => {
          const color = CATEGORY_COLORS[m.category];
          return (
            <article key={m.slug} style={{ background: "#FFF", borderRadius: 20, padding: "22px 20px", boxShadow: CARD_SHADOW }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 26, lineHeight: 1 }}>{m.emoji}</span>
                <div>
                  <Link href={`/menu/${m.slug}`} style={{ textDecoration: "none" }}>
                    <h2 style={{ fontWeight: 700, fontSize: 17, margin: 0, color: "#1D1D1F", letterSpacing: "-0.02em" }}>
                      {i + 1}. {m.name}
                    </h2>
                  </Link>
                  <span style={{ fontSize: 11, fontWeight: 600, color }}>{m.category}</span>
                  <span style={{ fontSize: 11, color: "#86868B", marginLeft: 6 }}>{m.price} · {m.time}</span>
                </div>
              </div>
              <Body>{m.why.split(". ").slice(0, 2).join(". ")}.</Body>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <Link
                  href={`/?menu=${m.slug}`}
                  className="apple-btn"
                  style={{
                    flex: 1, textAlign: "center", padding: "12px 0", borderRadius: 14,
                    background: BRAND, color: "#FFF", fontSize: 13, fontWeight: 600, textDecoration: "none", letterSpacing: "-0.01em",
                  }}
                >
                  📍 내 주변 {m.name} 찾기
                </Link>
                <Link
                  href={`/menu/${m.slug}`}
                  style={{
                    padding: "12px 16px", borderRadius: 14, background: "#F5F5F7",
                    color: "#1D1D1F", fontSize: 13, fontWeight: 600, textDecoration: "none", letterSpacing: "-0.01em",
                  }}
                >
                  자세히
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      <CtaLink href="/">🎲 그래도 고민되면 메뉴 룰렛 돌리기</CtaLink>

      <Card>
        <H2>다른 상황은요?</H2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
          {others.map((o) => (
            <Chip key={o.slug} href={`/situation/${o.slug}`}>{o.emoji} {o.label}</Chip>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}
