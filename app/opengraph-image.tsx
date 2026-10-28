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
  euforico: "#34d399",
  feliz: "#a7f3d0",
  estavel: "#e8edea",
  irritado: "#f5b04c",
  furioso: "#f87171",
  instavel: "#8fa8ba",
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
    // A figura do humor do dia; o estável usa a padrão (humor-og.png)
    mascot: mood && mood.id !== "estavel" ? `humor-og-${mood.id}.png` : undefined,
  });
}
