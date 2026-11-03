"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { DailyPoint } from "@/lib/awesomeapi";
import { formatBRL, formatNumber, formatPct } from "@/lib/format";
import { isGoodChange, type GoodWhen } from "@/lib/tone";
import PeriodToggle, { type PeriodDays } from "./PeriodToggle";
import GlassPanel from "./GlassPanel";

// Recharts sob demanda: fora do bundle da rota, o prefetch que a home faz das
// páginas de moeda não baixa mais o Recharts. O placeholder tem a altura do
// gráfico (280px), então nada se desloca quando ele chega.
const RateChart = dynamic(() => import("./RateChart"), {
  ssr: false,
  loading: () => (
    <p className="flex h-[280px] items-center justify-center text-sm text-ink-3" role="status">
      Carregando gráfico…
    </p>
  ),
});

interface HistoryPanelProps {
  /** rota que devolve { series } para ?days= (ex.: /api/history/eur) */
  historyPath: string;
  initialSeries: DailyPoint[];
  initialDays: PeriodDays;
  /** multiplicador do valor exibido (moedas cotadas em lote) */
  lote?: number;
  decimals?: number;
  /** reais (moedas) ou pontos (Ibovespa) */
  unit?: "brl" | "pontos";
  /** direção boa para o leitor, que colore a variação do período (ver lib/tone) */
  goodWhen?: GoodWhen;
}

/** Histórico com seletor de período, mínima/máxima/variação e gráfico. Serve
 *  às moedas e ao Ibovespa. */
export default function HistoryPanel({
  historyPath,
  initialSeries,
  initialDays,
  lote = 1,
  decimals = 2,
  unit = "brl",
  goodWhen = "down",
}: HistoryPanelProps) {
  const [days, setDays] = useState<PeriodDays>(initialDays);
  const [cache, setCache] = useState<Partial<Record<PeriodDays, DailyPoint[]>>>({
    [initialDays]: initialSeries,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const requested = useRef<Set<PeriodDays>>(new Set([initialDays]));

  useEffect(() => {
    if (requested.current.has(days)) return;
    requested.current.add(days);
    setLoading(true);
    setError(false);
    fetch(`${historyPath}?days=${days}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json() as Promise<{ series: DailyPoint[] }>;
      })
      .then(({ series }) => setCache((c) => ({ ...c, [days]: series })))
      .catch(() => {
        requested.current.delete(days);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [days, historyPath]);

  const series = cache[days];
  // pontos sem o "pts": a coluna é estreita e o painel já diz o que é
  const format = (v: number) => (unit === "pontos" ? formatNumber(v, 0) : formatBRL(v, decimals));
  const stats =
    series && series.length > 1
      ? {
          min: Math.min(...series.map((p) => p.bid)) * lote,
          max: Math.max(...series.map((p) => p.bid)) * lote,
          variation: ((series[series.length - 1].bid - series[0].bid) / series[0].bid) * 100,
        }
      : null;

  return (
    <GlassPanel className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xs font-medium uppercase tracking-widest text-ink-3">
          Histórico
        </h2>
        <PeriodToggle value={days} onChange={setDays} />
      </div>

      {stats && (
        <dl className="mt-4 flex divide-x divide-white/5 text-sm">
          <div className="pr-6">
            <dt className="text-xs text-ink-3">Mínima</dt>
            <dd className="tabular mt-0.5">{format(stats.min)}</dd>
          </div>
          <div className="px-6">
            <dt className="text-xs text-ink-3">Máxima</dt>
            <dd className="tabular mt-0.5">{format(stats.max)}</dd>
          </div>
          <div className="pl-6">
            <dt className="text-xs text-ink-3">Variação</dt>
            <dd
              className={`tabular mt-0.5 ${isGoodChange(stats.variation, goodWhen) ? "text-pos" : "text-neg"}`}
            >
              {formatPct(stats.variation)}
            </dd>
          </div>
        </dl>
      )}

      <div className={`mt-4 transition-opacity ${loading ? "opacity-50" : ""}`} aria-busy={loading}>
        {series && series.length > 1 ? (
          <RateChart data={series} lote={lote} decimals={decimals} unit={unit} height={280} />
        ) : error ? (
          <p className="py-10 text-center text-sm text-ink-2">
            O histórico recusou-se a responder. Tentando de novo pode funcionar.
          </p>
        ) : (
          <p className="py-10 text-center text-sm text-ink-3" role="status">
            Carregando histórico…
          </p>
        )}
      </div>
    </GlassPanel>
  );
}
