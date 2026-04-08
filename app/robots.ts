import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://jummechr.vercel.app/sitemap.xml", // 배포 후 실제 도메인으로 교체
  };
}
