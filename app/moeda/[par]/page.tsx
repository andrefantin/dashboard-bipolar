import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconArrowLeft } from "@tabler/icons-react";
import {
  CURRENCIES,
  fetchDailyHistory,
  fetchLatestRates,
  getCurrency,
} from "@/lib/awesomeapi";
import { formatBRL, formatTime } from "@/lib/format";
import Backdrop from "@/components/Backdrop";
import CurrencyDetail from "@/components/CurrencyDetail";
import CurrencyIcon from "@/components/CurrencyIcon";
import DeltaChip from "@/components/DeltaChip";
import GlassPanel from "@/components/GlassPanel";
import JsonLd from "@/components/JsonLd";
import RefreshButton from "@/components/RefreshButton";

export const revalidate = 300;

export function generateStaticParams() {
  return CURRENCIES.map((c) => ({ par: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ par: string }>;
}): Promise<Metadata> {
  const { par } = await params;
  const meta = getCurrency(par);
  if (!meta) return {};
  // Descrição com a cotação corrente — regenera junto com a página (ISR 5 min)
  let live = "";
  try {
    const rates = await fetchLatestRates();
    const rate = rates.find((r) => r.code === meta.code);
    if (rate) live = `${meta.nome} agora: ${formatBRL(rate.bid * meta.lote, meta.decimals)}${meta.loteLabel ? ` (${meta.loteLabel.toLowerCase()})` : ""}. `;
  } catch {
    // sem cotação ao vivo, a descrição estática continua válida
  }
  return {
    title: `Cotação do ${meta.nome} hoje (${meta.code})`,
    description: `${live}Veja a cotação do ${meta.nome} em reais em tempo real, variação do dia e histórico de 7 dias a 1 ano no Dólar Bipolar.`,
    alternates: { canonical: `/moeda/${meta.slug}` },
  };
}

export default async function CurrencyPage({
  params,
}: {
  params: Promise<{ par: string }>;
}) {
  const { par } = await params;
  const meta = getCurrency(par);
  if (!meta) notFound();

  const [ratesRes, historyRes] = await Promise.allSettled([
    fetchLatestRates(),
    fetchDailyHistory(meta.code, 30),
  ]);
  const rate =
    ratesRes.status === "fulfilled"
      ? ratesRes.value.find((r) => r.code === meta.code)
      : undefined;
  const series = historyRes.status === "fulfilled" ? historyRes.value : [];

  return (
    <>
      <Backdrop />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://dolarbipolar.com" },
            {
              "@type": "ListItem",
              position: 2,
              name: meta.nome,
              item: `https://dolarbipolar.com/moeda/${meta.slug}`,
            },
          ],
        }}
      />
      {rate && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ExchangeRateSpecification",
            currency: meta.code,
            currentExchangeRate: {
              "@type": "UnitPriceSpecification",
              price: rate.bid,
              priceCurrency: "BRL",
            },
            name: `Cotação do ${meta.nome} (${meta.code}/BRL)`,
          }}
        />
      )}

      <nav className="pt-6 text-sm" aria-label="Voltar">
        <Link href="/" className="inline-flex items-center gap-1.5 text-ink-2 hover:text-ink">
          <IconArrowLeft size={16} aria-hidden="true" />
          Todas as moedas
        </Link>
      </nav>

      <section className="flex flex-wrap items-end justify-between gap-4 py-6">
        <div>
          <div className="flex items-center gap-3">
            <CurrencyIcon symbol={meta.symbol} color={meta.color} size={44} />
            <div>
              <h1 className="font-display text-xl font-medium sm:text-2xl">{meta.nome}</h1>
              <p className="text-xs text-ink-3">{meta.loteLabel ?? meta.code}</p>
            </div>
          </div>
          {rate ? (
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="tabular font-display text-5xl font-semibold leading-none sm:text-6xl">
                {formatBRL(rate.bid * meta.lote, meta.decimals)}
              </span>
              <DeltaChip pct={rate.pctChange} large />
            </div>
          ) : (
            <p className="mt-4 text-ink-2">
              Cotação indisponível agora — o histórico abaixo continua de pé.
            </p>
          )}
          {rate && (
            <p className="tabular mt-3 text-sm text-ink-3">
              Mín {formatBRL(rate.low * meta.lote, meta.decimals)} · Máx{" "}
              {formatBRL(rate.high * meta.lote, meta.decimals)} · Atualizado às{" "}
              {formatTime(new Date(rate.timestamp))}
            </p>
          )}
        </div>
        <RefreshButton />
      </section>

      {series.length > 1 ? (
        <CurrencyDetail meta={meta} initialSeries={series} initialDays={30} />
      ) : (
        <GlassPanel className="p-6">
          <p className="text-ink-2">
            O histórico recusou-se a responder. Tente atualizar em instantes.
          </p>
        </GlassPanel>
      )}
    </>
  );
}
