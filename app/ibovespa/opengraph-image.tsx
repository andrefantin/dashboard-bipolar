import { fetchIbovespa } from "@/lib/ibovespa";
import { formatNumber, formatPct } from "@/lib/format";
import { OG_SIZE, renderOgCard } from "@/lib/ogCard";

// Cartão de compartilhamento do Ibovespa: pontuação ao vivo e a maior alta
// do dia. Verde é alta aqui (ver lib/tone).

export const alt = "Ibovespa hoje: pontuação e maiores altas — Dólar Bipolar";
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 300; // mesmo ritmo das cotações

export default async function OpengraphImage() {
  const { quote, stocks } = await fetchIbovespa();
  const top = stocks
    .filter((s) => s.variacao !== null)
    .sort((a, b) => b.variacao! - a.variacao!)[0];

  return renderOgCard({
    overline: "Ibovespa hoje · pontos",
    price: quote ? formatNumber(quote.points, 0) : null,
    pct: quote?.pctChange ?? null,
    footnote: top && top.variacao! > 0 ? `Maior alta: ${top.ticker} ${formatPct(top.variacao!)}` : undefined,
    // destaque sempre verde: o rodapé é a maior alta, e a pílula já dá a direção do dia
    goodWhen: "up",
  });
}
