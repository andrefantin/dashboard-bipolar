import type { Metadata } from "next";
import Link from "next/link";
import { IconChevronRight } from "@tabler/icons-react";
import {
  CURRENCIES,
  fetchBovespa,
  fetchDailyHistory,
  fetchLatestRates,
  type BovespaQuote,
  type DailyPoint,
  type Rate,
} from "@/lib/awesomeapi";
import { fetchNews, type NewsItem } from "@/lib/news";
import { computeMood } from "@/lib/mood";
import { formatBRL, formatTime } from "@/lib/format";
import Backdrop from "@/components/Backdrop";
import MoodCard from "@/components/MoodCard";
import RateRow from "@/components/RateRow";
import BovespaRow from "@/components/BovespaCard";
import NewsExplainer from "@/components/NewsExplainer";
import RefreshButton from "@/components/RefreshButton";
import DeltaChip from "@/components/DeltaChip";
import JsonLd from "@/components/JsonLd";

export const revalidate = 300;

// O dólar já é o herói do topo — na lista ficam as demais moedas
const BOARD_CURRENCIES = CURRENCIES.filter((c) => c.code !== "USD");

function settled<T>(r: PromiseSettledResult<T> | undefined): T | null {
  return r?.status === "fulfilled" ? r.value : null;
}

/** Título/descrição com a cotação corrente — regenera junto com a página (ISR 5 min). */
export async function generateMetadata(): Promise<Metadata> {
  try {
    const rates = await fetchLatestRates();
    const usd = rates.find((r) => r.code === "USD");
    if (!usd) throw new Error();
    const price = formatBRL(usd.bid, 2);
    return {
      title: { absolute: `Dólar hoje: ${price} — cotação em tempo real | Dólar Bipolar` },
      description: `Dólar comercial agora: ${price} (mín ${formatBRL(usd.low, 2)}, máx ${formatBRL(usd.high, 2)} hoje). Euro, libra, bitcoin e mais, com histórico, notícias e o Índice de Humor do Dólar.`,
    };
  } catch {
    return {};
  }
}

export default async function HomePage() {
  const [ratesRes, usdRes, newsRes, bovespaRes, ...sparkRes] = await Promise.allSettled([
    fetchLatestRates(),
    fetchDailyHistory("USD", 31), // 31 pontos → 30 variações diárias
    fetchNews(),
    fetchBovespa(),
    ...BOARD_CURRENCIES.map((c) => fetchDailyHistory(c.code, 8)),
  ]);

  const rates = settled(ratesRes) as Rate[] | null;
  const usdSeries = settled(usdRes) as DailyPoint[] | null;
  const news = settled(newsRes) as NewsItem[] | null;
  const bovespa = settled(bovespaRes) as BovespaQuote | null;

  const sparks = new Map<string, number[]>();
  BOARD_CURRENCIES.forEach((c, i) => {
    const series = settled(sparkRes[i]) as DailyPoint[] | null;
    if (series) sparks.set(c.code, series.map((p) => p.bid));
  });

  const mood = usdSeries && usdSeries.length > 2 ? computeMood(usdSeries) : null;
  const usd = rates?.find((r) => r.code === "USD") ?? null;
  const updatedAt = rates?.length
    ? formatTime(new Date(Math.max(...rates.map((r) => r.timestamp))))
    : null;

  return (
    <>
      <Backdrop mood={mood?.id} />
      {usd && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ExchangeRateSpecification",
            currency: "USD",
            currentExchangeRate: {
              "@type": "UnitPriceSpecification",
              price: usd.bid,
              priceCurrency: "BRL",
            },
            name: "Cotação do dólar comercial (USD/BRL)",
          }}
        />
      )}

      {/* Herói: um número grande por tela — o resto fala baixo */}
      <section className="glass-raised mt-8 grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
        <div>
          <h1 className="text-xs font-medium uppercase tracking-widest text-ink-3">
            Cotação do dólar hoje
          </h1>
          {usd ? (
            <>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="tabular font-display text-5xl font-semibold leading-none sm:text-6xl">
                  {formatBRL(usd.bid, 2)}
                </span>
                <DeltaChip pct={usd.pctChange} large />
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-ink-3">
                <span className="tabular">
                  Mín {formatBRL(usd.low, 2)} · Máx {formatBRL(usd.high, 2)}
                  {updatedAt && <> · Atualizado às {updatedAt}</>}
                </span>
                <RefreshButton />
                <Link
                  href="/moeda/usd"
                  className="inline-flex items-center gap-0.5 text-ink-2 transition-colors hover:text-ink"
                >
                  Ver histórico
                  <IconChevronRight size={15} aria-hidden="true" />
                </Link>
              </div>
            </>
          ) : (
            <p className="mt-3 max-w-sm text-ink-2">
              O dólar recusou-se a responder. Use o “Atualizar” em alguns instantes.
              <span className="mt-3 block">
                <RefreshButton />
              </span>
            </p>
          )}
        </div>

        <div className="border-t border-white/5 pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
          {mood && usdSeries ? (
            <MoodCard mood={mood} series={usdSeries} />
          ) : (
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-ink-3">
                Índice de Humor do Dólar
              </p>
              <p className="mt-2 text-sm text-ink-2">
                O humor não pôde ser medido agora — nem o dólar sabe como está.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Manchetes em letreiro, coladas ao herói; a análise vive num modal */}
      <div className="mt-4 px-6 sm:px-0">
        <NewsExplainer
          news={news ?? []}
          series={usdSeries ?? []}
          newsFailed={news === null}
        />
      </div>

      {/* Painel de moedas: lista aberta, sem caixa */}
      <section aria-label="Painel de cotações" className="mt-10">
        <h2 className="px-6 text-xs font-medium uppercase tracking-widest text-ink-3 sm:px-8">
          Moedas
        </h2>
        {rates ? (
          <div className="mt-2 grid gap-x-10 lg:grid-cols-2">
            {BOARD_CURRENCIES.map((meta) => (
              <div key={meta.code} className="border-b border-white/5">
                <RateRow
                  meta={meta}
                  rate={rates.find((r) => r.code === meta.code)}
                  spark={sparks.get(meta.code)}
                />
              </div>
            ))}
            {bovespa && (
              <div className="border-b border-white/5">
                <BovespaRow quote={bovespa} />
              </div>
            )}
          </div>
        ) : (
          <p className="mt-2 px-6 text-sm text-ink-2 sm:px-8">
            Nenhuma cotação chegou. O mercado está de castigo — tente atualizar.
          </p>
        )}
      </section>
    </>
  );
}
