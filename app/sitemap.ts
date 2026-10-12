import type { MetadataRoute } from "next";
import { MENUS } from "@/lib/menus";
import { SITUATIONS } from "@/lib/situations";

const SITE_URL = "https://jummechr.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/menu`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...SITUATIONS.map((s) => ({
      url: `${SITE_URL}/situation/${s.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...MENUS.map((m) => ({
      url: `${SITE_URL}/menu/${m.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
