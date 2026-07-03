import { XMLParser } from "fast-xml-parser";
import { dayKey } from "./format";

// Google News RSS: só títulos + fonte + link, sempre apontando para o
// veículo original. Nunca reproduzimos corpo de matéria.

export interface NewsItem {
  title: string;
  source: string;
  url: string;
  /** ISO 8601 */
  publishedAt: string;
}

export const REVALIDATE_NEWS = 1800; // 30 min

const QUERIES = ["dólar hoje", "dólar real câmbio"];

interface RssItem {
  title?: string;
  link?: string;
  pubDate?: string;
  source?: { "#text"?: string } | string;
}

function parseFeed(xml: string): NewsItem[] {
  const parser = new XMLParser({ ignoreAttributes: false });
  const parsed = parser.parse(xml) as {
    rss?: { channel?: { item?: RssItem | RssItem[] } };
  };
  const rawItems = parsed.rss?.channel?.item;
  const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

  return items.flatMap((item) => {
    if (!item.title || !item.link || !item.pubDate) return [];
    const source =
      typeof item.source === "string" ? item.source : item.source?.["#text"] ?? "";
    // O Google anexa " - Fonte" ao título; removemos para não duplicar.
    let title = item.title;
    if (source && title.endsWith(` - ${source}`)) {
      title = title.slice(0, -(source.length + 3));
    }
    const publishedAt = new Date(item.pubDate);
    if (isNaN(publishedAt.getTime())) return [];
    return [
      {
        title: title.trim(),
        source: source || "Google Notícias",
        url: item.link,
        publishedAt: publishedAt.toISOString(),
      },
    ];
  });
}

function normalizeTitle(title: string): string[] {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

/** Similaridade de Jaccard entre conjuntos de palavras dos títulos. */
function similar(a: string[], b: string[]): boolean {
  if (a.length === 0 || b.length === 0) return false;
  const setB = new Set(b);
  const inter = a.filter((w) => setB.has(w)).length;
  const union = new Set([...a, ...b]).size;
  return inter / union >= 0.6;
}

function dedupe(items: NewsItem[]): NewsItem[] {
  const kept: { item: NewsItem; tokens: string[] }[] = [];
  for (const item of items) {
    const tokens = normalizeTitle(item.title);
    if (!kept.some((k) => similar(k.tokens, tokens))) {
      kept.push({ item, tokens });
    }
  }
  return kept.map((k) => k.item);
}

export async function fetchNews(): Promise<NewsItem[]> {
  const feeds = await Promise.allSettled(
    QUERIES.map(async (q) => {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
      const res = await fetch(url, {
        next: { revalidate: REVALIDATE_NEWS },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`Google News RSS ${res.status}`);
      return parseFeed(await res.text());
    })
  );
  const all = feeds.flatMap((f) => (f.status === "fulfilled" ? f.value : []));
  if (all.length === 0 && feeds.every((f) => f.status === "rejected")) {
    throw new Error("Nenhum feed de notícias respondeu");
  }
  all.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  return dedupe(all).slice(0, 40);
}

/** Agrupa por dia (fuso de SP) para casar com a série diária do gráfico. */
export function groupNewsByDay(items: NewsItem[]): Record<string, NewsItem[]> {
  const buckets: Record<string, NewsItem[]> = {};
  for (const item of items) {
    const key = dayKey(new Date(item.publishedAt));
    (buckets[key] ??= []).push(item);
  }
  return buckets;
}
