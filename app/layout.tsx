import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

const GA_ID = "G-RWMLN28D7H";

const SITE_NAME = "점메추 지도";
const TITLE = "점메추 지도 — 오늘 점심 뭐 먹지? 내 주변 맛집 4곳 추천";
const DESC =
  "매일 반복되는 점심 메뉴 고민, 점메추 지도가 해결해드려요. 현재 위치 500m 이내 한식·중식·일식·양식 맛집 4곳을 즉시 추천합니다. 직장인 점심 메뉴 추천 서비스.";
const SITE_URL = "https://jummechr.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESC,
  keywords: [
    "점메추",
    "점심 메뉴 추천",
    "점심메뉴추천",
    "점심 추천",
    "오늘 점심 뭐먹지",
    "점심 뭐먹지",
    "주변 맛집 추천",
    "직장인 점심",
    "점심 맛집",
    "내 주변 맛집",
    "점심 랜덤 추천",
    "점메추 지도",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: TITLE,
    description: DESC,
    url: SITE_URL,
    locale: "ko_KR",
    images: [{ url: `${SITE_URL}/og.jpg`, width: 1200, height: 630, alt: "점메추 지도 — 한식·중식·일식·양식 점심 맛집 추천" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESC,
    images: [`${SITE_URL}/og.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  verification: {
    google: "NSwJ4069-ctjVKHyqmRDUXxfeI4syxCr0KNbJukNDYg",
    other: { "naver-site-verification": "63b592a908998c915220b31c21da0def2c532ac4" },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "점메추 지도",
    alternateName: ["점메추", "점심 메뉴 추천", "JUMMECHR"],
    description: DESC,
    url: SITE_URL,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    inLanguage: "ko",
    offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
    audience: {
      "@type": "Audience",
      audienceType: "직장인",
      description: "매일 점심 메뉴 선택에 고민하는 직장인",
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "점메추가 뭔가요?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "점메추는 '점심 메뉴 추천'의 줄임말입니다. 점메추 지도는 현재 위치 기반으로 500m 이내 맛집 4곳을 한식·중식·일식·양식으로 나눠 추천하는 무료 서비스입니다.",
        },
      },
      {
        "@type": "Question",
        name: "점메추 지도는 어떻게 사용하나요?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "점메추 지도 사이트에 접속해서 '뽑기 시작' 버튼을 누르면 됩니다. 위치 권한을 허용하면 내 주변 500m 이내 식당 4곳이 한식·중식·일식·양식으로 바로 추천됩니다. 마음에 안 들면 '다시 뽑기'를 누르면 다른 가게가 나옵니다.",
        },
      },
      {
        "@type": "Question",
        name: "추천되는 식당은 어떤 기준인가요?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "현재 위치에서 도보 5분 거리(500m) 이내의 식당 중 한식·중식·일식·양식 4개 카테고리에서 각 1곳씩 랜덤으로 추천합니다. 매번 다른 가게가 나와서 새로운 맛집을 발견할 수 있습니다.",
        },
      },
    ],
  };

  return (
    <html lang="ko">
      <head>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="ga4" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}</Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
