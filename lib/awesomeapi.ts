import { dayKey } from "./format";

// Fonte: AwesomeAPI (https://docs.awesomeapi.com.br/api-de-moedas) — gratuita, sem chave.

export interface CurrencyMeta {
  code: string;
  /** slug de rota: /moeda/usd */
  slug: string;
  nome: string;
  /** artigo do nome, para "do euro" / "da libra" */
  artigo: "o" | "a";
  /** JPY/ARS cotados por unidade — exibimos por lote, como no site v1. */
  lote: number;
  loteLabel: string | null;
  decimals: number;
  /** cor de identidade — é o que torna a lista escaneável.
   *  Nunca reutilizar as cores semânticas (pos/neg/warm): verde e vermelho
   *  significam direção, sempre. */
  color: string;
}

export const CURRENCIES: CurrencyMeta[] = [
  { code: "USD", slug: "usd", nome: "Dólar Comercial", artigo: "o", lote: 1, loteLabel: null, decimals: 2, color: "#6ee7b7" },
  { code: "EUR", slug: "eur", nome: "Euro", artigo: "o", lote: 1, loteLabel: null, decimals: 2, color: "#60a5fa" },
  { code: "GBP", slug: "gbp", nome: "Libra Esterlina", artigo: "a", lote: 1, loteLabel: null, decimals: 2, color: "#a78bfa" },
  { code: "BTC", slug: "btc", nome: "Bitcoin", artigo: "o", lote: 1, loteLabel: null, decimals: 0, color: "#fb923c" },
  { code: "CAD", slug: "cad", nome: "Dólar Canadense", artigo: "o", lote: 1, loteLabel: null, decimals: 2, color: "#e879f9" },
  { code: "ARS", slug: "ars", nome: "Peso Argentino", artigo: "o", lote: 100, loteLabel: "Lote de 100", decimals: 2, color: "#7dd3fc" },
  { code: "JPY", slug: "jpy", nome: "Iene Japonês", artigo: "o", lote: 100, loteLabel: "Lote de 100", decimals: 2, color: "#f9a8d4" },
  { code: "KRW", slug: "krw", nome: "Won Sul-Coreano", artigo: "o", lote: 1000, loteLabel: "Lote de 1000", decimals: 2, color: "#5eead4" },
  { code: "AUD", slug: "aud", nome: "Dólar Australiano", artigo: "o", lote: 1, loteLabel: null, decimals: 2, color: "#fbbf24" },
];

/** "do Euro", "da Libra Esterlina" — para títulos e textos. */
export function deMoeda(meta: CurrencyMeta): string {
  return `${meta.artigo === "a" ? "da" : "do"} ${meta.nome}`;
}

export function getCurrency(slugOrCode: string): CurrencyMeta | undefined {
  const q = slugOrCode.toLowerCase();
  return CURRENCIES.find((c) => c.slug === q || c.code.toLowerCase() === q);
}

export interface Rate {
  code: string;
  /** cotação por unidade, em BRL */
  bid: number;
  high: number;
  low: number;
  pctChange: number;
  /** epoch ms */
  timestamp: number;
}

export interface DailyPoint {
  /** "2026-07-02" no fuso de SP */
  date: string;
  /** epoch ms */
  timestamp: number;
  bid: number;
  pctChange: number;
}

export const REVALIDATE_RATES = 300; // 5 min
export const REVALIDATE_HISTORY = 21_600; // 6 h

const BASE = "https://economia.awesomeapi.com.br/json";

/** Token gratuito opcional (cadastro em awesomeapi.com.br/auth/signup) —
 *  sem ele o tier anônimo tem uma cota bem mais baixa e sujeita a 429.
 *  Vai no header `x-api-key`, nunca na URL: URLs aparecem nos nossos logs
 *  de erro e na lista de chamadas externas dos logs da Vercel. */
function authHeaders(): HeadersInit | undefined {
  const token = process.env.AWESOMEAPI_TOKEN;
  return token ? { "x-api-key": token } : undefined;
}

interface RawQuote {
  code?: string;
  bid: string;
  high: string;
  low: string;
  pctChange: string;
  timestamp: string;
}

async function apiFetch<T>(url: string, revalidate: number): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: authHeaders(),
      next: { revalidate },
      signal: AbortSignal.timeout(8000),
    });
  } catch (err) {
    // Falha de rede/DNS/timeout — logamos para diagnosticar em produção,
    // já que o chamador só repassa uma mensagem genérica ao usuário.
    console.error(`[awesomeapi] fetch falhou em ${url}:`, err);
    throw err;
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(
      `[awesomeapi] ${res.status} ${res.statusText} em ${url} — corpo: ${body.slice(0, 300)}`
    );
    throw new Error(`AwesomeAPI ${res.status} em ${url}`);
  }
  return res.json() as Promise<T>;
}

/** BTC-BRL deve estar na casa das centenas de milhar; alguns campos da API
 *  já vieram em milhares no passado — corrige a magnitude se necessário. */
function sanitizeBid(code: string, bid: number): number {
  if (code === "BTC" && bid > 0 && bid < 10_000) return bid * 1000;
  return bid;
}

export async function fetchLatestRates(): Promise<Rate[]> {
  const pairs = CURRENCIES.map((c) => `${c.code}-BRL`).join(",");
  const data = await apiFetch<Record<string, RawQuote>>(
    `${BASE}/last/${pairs}`,
    REVALIDATE_RATES
  );
  return CURRENCIES.flatMap((c) => {
    const raw = data[`${c.code}BRL`];
    if (!raw) return [];
    return [
      {
        code: c.code,
        bid: sanitizeBid(c.code, parseFloat(raw.bid)),
        high: sanitizeBid(c.code, parseFloat(raw.high)),
        low: sanitizeBid(c.code, parseFloat(raw.low)),
        pctChange: parseFloat(raw.pctChange),
        timestamp: parseInt(raw.timestamp, 10) * 1000,
      },
    ];
  });
}

/**
 * Série diária, do mais antigo para o mais recente. O primeiro item retornado
 * pela API é a cotação corrente (dia parcial); os demais são fechamentos.
 */
export async function fetchDailyHistory(code: string, days: number): Promise<DailyPoint[]> {
  const data = await apiFetch<RawQuote[]>(
    `${BASE}/daily/${code}-BRL/${days}`,
    REVALIDATE_HISTORY
  );
  const seen = new Set<string>();
  const points: DailyPoint[] = [];
  for (const raw of data) {
    const timestamp = parseInt(raw.timestamp, 10) * 1000;
    const date = dayKey(new Date(timestamp));
    if (seen.has(date)) continue; // mantém a entrada mais recente de cada dia
    seen.add(date);
    points.push({
      date,
      timestamp,
      bid: sanitizeBid(code, parseFloat(raw.bid)),
      pctChange: parseFloat(raw.pctChange),
    });
  }
  return points.reverse();
}

/**
 * Série diária com o ponto de hoje vindo da cotação ao vivo. O histórico fica
 * em cache por 6 h (dias passados não mudam), mas o ponto do dia mudaria por
 * baixo disso: sem esta troca, o Índice de Humor e as sparklines passavam até
 * 6 h descrevendo o dólar de ontem.
 */
export function withLiveToday(series: DailyPoint[], rate?: Rate): DailyPoint[] {
  if (!rate) return series;
  const today = dayKey(new Date(rate.timestamp));
  return [
    ...series.filter((p) => p.date !== today),
    { date: today, timestamp: rate.timestamp, bid: rate.bid, pctChange: rate.pctChange },
  ];
}

export interface BovespaQuote {
  points: number;
  pctChange: number;
  timestamp: number;
}

/** Índice Bovespa via brapi.dev — opcional. Sem BRAPI_TOKEN (ou com erro),
 *  retorna null e o card simplesmente não aparece. */
export async function fetchBovespa(): Promise<BovespaQuote | null> {
  const token = process.env.BRAPI_TOKEN;
  if (!token) return null;
  try {
    // Token no header (recomendação da própria brapi), fora da URL e dos logs.
    const res = await fetch("https://brapi.dev/api/quote/%5EBVSP", {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: REVALIDATE_RATES },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      results?: { regularMarketPrice?: number; regularMarketChangePercent?: number; regularMarketTime?: string }[];
    };
    const q = data.results?.[0];
    if (!q || typeof q.regularMarketPrice !== "number") return null;
    return {
      points: q.regularMarketPrice,
      pctChange: q.regularMarketChangePercent ?? 0,
      timestamp: q.regularMarketTime ? new Date(q.regularMarketTime).getTime() : Date.now(),
    };
  } catch {
    return null;
  }
}
