import type { MetadataRoute } from "next";
import { CURRENCIES } from "@/lib/awesomeapi";
import { SITE_URL } from "@/lib/site";

const BASE = SITE_URL;

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, changeFrequency: "hourly", priority: 1 },
    { url: `${BASE}/comparar`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/duvidas`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/sobre`, changeFrequency: "monthly", priority: 0.5 },
    ...CURRENCIES.map((c) => ({
      url: `${BASE}/moeda/${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];
}
