import { CURRENCIES, deMoeda, fetchLatestRates, getCurrency } from "@/lib/awesomeapi";
import { formatBRL } from "@/lib/format";
import { OG_SIZE, renderOgCard } from "@/lib/ogCard";

// Cartão de compartilhamento de cada moeda, com a cotação ao vivo.

export const alt = "Cotação de hoje em reais — Dólar Bipolar";
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 300;

// Gerado no build para cada moeda e renovado a cada 5 min, em vez de
// redesenhado a cada visita de robô de rede social.
export function generateStaticParams() {
  return CURRENCIES.map((c) => ({ par: c.slug }));
}

export default async function OpengraphImage({ params }: { params: Promise<{ par: string }> }) {
  const meta = getCurrency((await params).par);
  if (!meta) return renderOgCard({ overline: "Cotação de hoje", price: null, pct: null });

  let rate;
  try {
    rate = (await fetchLatestRates()).find((r) => r.code === meta.code);
  } catch {
    rate = undefined;
  }

  return renderOgCard({
    overline: `Cotação ${deMoeda(meta)} hoje`,
    price: rate ? formatBRL(rate.bid * meta.lote, meta.decimals) : null,
    pct: rate?.pctChange ?? null,
    footnote: meta.loteLabel ? `${meta.loteLabel} · ${meta.code}/BRL` : `${meta.code}/BRL`,
    accent: meta.color,
  });
}
