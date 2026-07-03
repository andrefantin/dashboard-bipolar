"use client";

import { useEffect, useRef, useState } from "react";
import type { CurrencyMeta, DailyPoint } from "@/lib/awesomeapi";
import { formatBRL, formatPct } from "@/lib/format";
import PeriodToggle, { type PeriodDays } from "./PeriodToggle";
import RateChart from "./RateChart";
import GlassPanel from "./GlassPanel";

interface CurrencyDetailProps {
  meta: CurrencyMeta;
  initialSeries: DailyPoint[];
  initialDays: PeriodDays;
}

export default function CurrencyDetail({ meta, initialSeries, initialDays }: CurrencyDetailProps) {
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
    fetch(`/api/history/${meta.slug}?days=${days}`)
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
  }, [days, meta.slug]);

  const series = cache[days];
  const stats =
    series && series.length > 1
      ? {
          min: Math.min(...series.map((p) => p.bid)) * meta.lote,
          max: Math.max(...series.map((p) => p.bid)) * meta.lote,
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
            <dd className="tabular mt-0.5">{formatBRL(stats.min, meta.decimals)}</dd>
          </div>
          <div className="px-6">
            <dt className="text-xs text-ink-3">Máxima</dt>
            <dd className="tabular mt-0.5">{formatBRL(stats.max, meta.decimals)}</dd>
          </div>
          <div className="pl-6">
            <dt className="text-xs text-ink-3">Variação</dt>
            <dd
              className={`tabular mt-0.5 ${stats.variation >= 0 ? "text-pos" : "text-neg"}`}
            >
              {formatPct(stats.variation)}
            </dd>
          </div>
        </dl>
      )}

      <div className={`mt-4 transition-opacity ${loading ? "opacity-50" : ""}`} aria-busy={loading}>
        {series && series.length > 1 ? (
          <RateChart data={series} lote={meta.lote} decimals={meta.decimals} height={280} />
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
