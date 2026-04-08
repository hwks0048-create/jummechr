import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://jummechr.vercel.app", // 배포 후 실제 도메인으로 교체
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
