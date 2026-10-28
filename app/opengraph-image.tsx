import { fetchDailyHistory, fetchLatestRates, withLiveToday } from "@/lib/awesomeapi";
import { formatBRL } from "@/lib/format";
import { computeMood, type MoodId } from "@/lib/mood";
import { OG_SIZE, renderOgCard } from "@/lib/ogCard";

// Cartão de compartilhamento da home (e fallback das páginas sem o seu):
// cotação do dólar ao vivo + o humor do dia, na cor do humor.

export const alt = "Cotação do dólar hoje e o Índice de Humor do Dólar — Dólar Bipolar";
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 300; // mesmo ritmo das cotações

const MOOD_COLOR: Record<MoodId, string> = {
  mania: "#f5b04c",
  agitado: "#f5b04c",
  estavel: "#34d399",
  baixa: "#8fa8ba",
  depressivo: "#8fa8ba",
};

export default async function OpengraphImage() {
  const [ratesRes, historyRes] = await Promise.allSettled([
    fetchLatestRates(),
    fetchDailyHistory("USD", 31),
  ]);
  const usd = ratesRes.status === "fulfilled" ? ratesRes.value.find((r) => r.code === "USD") : undefined;
  const history = historyRes.status === "fulfilled" ? historyRes.value : [];
  const series = withLiveToday(history, usd);
  const mood = series.length > 2 ? computeMood(series) : null;

  return renderOgCard({
    overline: "Cotação do dólar hoje",
    price: usd ? formatBRL(usd.bid, 2) : null,
    pct: usd?.pctChange ?? null,
    footnote: mood ? `Humor do dólar: ${mood.label}` : undefined,
    accent: mood ? MOOD_COLOR[mood.id] : undefined,
  });
}
