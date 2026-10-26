import type { Metadata } from "next";
import TransitionLink from "@/components/TransitionLink";
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

      {/* Título grande (iOS): ao rolar, recolhe para a barra de cima (NavTitle) */}
      <div className="flex items-center justify-between gap-4 pt-5 md:pt-8">
        <h1
          data-large-title="Dólar hoje"
          className="font-display text-large-title font-semibold tracking-tight"
        >
          Dólar hoje
        </h1>
        <RefreshButton />
      </div>

      <section className="mt-2 grid gap-5 lg:grid-cols-[1.1fr_1fr] lg:gap-6">
        {/* Cotação sem caixa, como no app Ações: um número grande, o resto baixo */}
        <div className="lg:py-2">
          <p className="text-footnote text-ink-3">Cotação do dólar comercial · USD/BRL</p>
          {usd ? (
            <>
              {/* O número-herói fica fora da escala de títulos: 40px é maior
                  que o Large Title (para ser o centro da tela) sem gritar. */}
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
                <span
                  className="tabular font-display text-[40px] font-semibold leading-none md:text-5xl"
                >
                  {formatBRL(usd.bid, 2)}
                </span>
                <DeltaChip pct={usd.pctChange} large />
              </div>
              <p className="tabular mt-3 text-subhead text-ink-3">
                Mín {formatBRL(usd.low, 2)} · Máx {formatBRL(usd.high, 2)}
                {updatedAt && <> · Atualizado às {updatedAt}</>}
              </p>
              <TransitionLink
                nav="push"
                currency="usd"
                href="/moeda/usd"
                className="mt-1 inline-flex min-h-11 items-center gap-0.5 text-body text-pos transition-opacity active:opacity-60 md:hover:underline"
              >
                Ver histórico
                <IconChevronRight size={16} aria-hidden="true" />
              </TransitionLink>
            </>
          ) : (
            <p className="mt-2 max-w-sm text-ink-2">
              O dólar recusou-se a responder. Toque em atualizar em alguns instantes.
            </p>
          )}
        </div>

        {/* Humor como widget do iOS */}
        <div className="glass p-5 sm:p-6">
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

      {/* Manchetes logo abaixo do herói; a análise abre num sheet/modal */}
      <section aria-label="Notícias" className="mt-8">
        <NewsExplainer
          news={news ?? []}
          series={usdSeries ?? []}
          newsFailed={news === null}
        />
      </section>

      {/* Moedas: lista agrupada do iOS, separadores recuados depois do ícone.
          A primeira linha (no desktop largo, as duas da primeira fileira)
          não leva separador. */}
      <section aria-labelledby="moedas-titulo" className="mt-8">
        <h2
          id="moedas-titulo"
          className="mb-2 text-footnote font-medium uppercase tracking-wider text-ink-3"
        >
          Moedas
        </h2>
        {rates ? (
          <div className="glass overflow-hidden lg:grid lg:grid-cols-2 [&>*:first-child_.row-sep]:border-t-0 lg:[&>*:nth-child(2)_.row-sep]:border-t-0">
            {BOARD_CURRENCIES.map((meta) => (
              <RateRow
                key={meta.code}
                meta={meta}
                rate={rates.find((r) => r.code === meta.code)}
                spark={sparks.get(meta.code)}
              />
            ))}
            {bovespa && <BovespaRow quote={bovespa} />}
          </div>
        ) : (
          <p className="text-sm text-ink-2">
            Nenhuma cotação chegou. O mercado está de castigo — tente atualizar.
          </p>
        )}
      </section>
    </>
  );
}
