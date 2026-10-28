import type { MetadataRoute } from "next";
import { CURRENCIES } from "@/lib/awesomeapi";
import { SITE_URL } from "@/lib/site";

const BASE = SITE_URL;

// Regenera de hora em hora: as páginas de cotação mudam o dia todo, e o
// <lastmod> diz ao Google quando vale recrawlear.
export const revalidate = 3600;

// Páginas de conteúdo fixo: data da última revisão do texto (não "agora",
// para o Google não aprender que o lastmod daqui é ruído).
const CONTENT_UPDATED = new Date("2026-10-27");

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: BASE, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${BASE}/comparar`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/duvidas`, lastModified: CONTENT_UPDATED, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/sobre`, lastModified: CONTENT_UPDATED, changeFrequency: "monthly", priority: 0.5 },
    ...CURRENCIES.map((c) => ({
      url: `${BASE}/moeda/${c.slug}`,
      lastModified: now,
      changeFrequency: "hourly" as const,
      priority: 0.7,
    })),
  ];
}
