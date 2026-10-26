import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconChevronLeft } from "@tabler/icons-react";
import {
  CURRENCIES,
  fetchDailyHistory,
  fetchLatestRates,
  getCurrency,
} from "@/lib/awesomeapi";
import { formatBRL, formatTime } from "@/lib/format";
import { SITE_URL } from "@/lib/site";
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
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            {
              "@type": "ListItem",
              position: 2,
              name: meta.nome,
              item: `${SITE_URL}/moeda/${meta.slug}`,
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

      {/* Botão "voltar" do iOS: chevron + nome da tela anterior, na cor de destaque */}
      <nav className="flex items-center justify-between pt-2 md:pt-6" aria-label="Voltar">
        <Link
          href="/"
          className="-ml-2 inline-flex min-h-11 items-center gap-0.5 px-1 text-body text-pos transition-opacity active:opacity-60 md:text-sm md:hover:underline"
        >
          <IconChevronLeft size={24} stroke={2.2} aria-hidden="true" className="md:h-4 md:w-4" />
          Cotações
        </Link>
        <RefreshButton />
      </nav>

      <section className="pb-6 pt-2 md:pt-4">
        <div>
          <div className="flex items-center gap-3">
            <CurrencyIcon symbol={meta.symbol} color={meta.color} size={44} />
            {/* Tela interna (empilhada sobre Cotações): título padrão (Title 2),
                não Large Title — esse fica só nas telas raiz das abas. */}
            <div className="min-w-0">
              <h1
                data-large-title={meta.nome}
                className="font-display text-title2 font-semibold tracking-tight"
              >
                {meta.nome}
              </h1>
              <p className="text-footnote text-ink-3">
                {meta.code}/BRL{meta.loteLabel && ` · ${meta.loteLabel.toLowerCase()}`}
              </p>
            </div>
          </div>
          {rate ? (
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="tabular font-display text-[40px] font-semibold leading-none md:text-5xl">
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
            <p className="tabular mt-3 text-subhead text-ink-3">
              Mín {formatBRL(rate.low * meta.lote, meta.decimals)} · Máx{" "}
              {formatBRL(rate.high * meta.lote, meta.decimals)} · Atualizado às{" "}
              {formatTime(new Date(rate.timestamp))}
            </p>
          )}
        </div>
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
