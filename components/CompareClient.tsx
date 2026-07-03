"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CURRENCIES, type DailyPoint } from "@/lib/awesomeapi";
import { formatLongDate, formatNumber, formatPct, formatShortDate } from "@/lib/format";
import PeriodToggle, { type PeriodDays } from "./PeriodToggle";
import GlassPanel from "./GlassPanel";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

const MAX_SELECTED = 4;
const MIN_SELECTED = 2;

type SeriesCache = Record<string, DailyPoint[]>; // chave: `${code}:${days}`

interface MergedRow {
  date: string;
  timestamp: number;
  [code: string]: string | number | null;
}

function CompareTooltip({
  active,
  payload,
  label,
  rows,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number; color: string }[];
  label?: string;
  rows: MergedRow[];
}) {
  if (!active || !payload?.length || !label) return null;
  const row = rows.find((r) => r.date === label);
  return (
    <div className="glass-raised px-3 py-2 text-sm">
      <p className="text-xs text-ink-3">
        {row ? formatLongDate(new Date(row.timestamp)) : label}
      </p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="tabular" style={{ color: entry.color }}>
          {entry.dataKey}: {formatNumber(entry.value, 1)}
        </p>
      ))}
    </div>
  );
}

export default function CompareClient() {
  const [selected, setSelected] = useState<string[]>(["USD", "EUR"]);
  const [days, setDays] = useState<PeriodDays>(30);
  const [cache, setCache] = useState<SeriesCache>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const missing = selected.filter((code) => !cache[`${code}:${days}`]);
    if (missing.length === 0) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    Promise.all(
      missing.map(async (code) => {
        const meta = CURRENCIES.find((c) => c.code === code)!;
        const res = await fetch(`/api/history/${meta.slug}?days=${days}`);
        if (!res.ok) throw new Error();
        const { series } = (await res.json()) as { series: DailyPoint[] };
        return [code, series] as const;
      })
    )
      .then((entries) => {
        if (cancelled) return;
        setCache((c) => {
          const next = { ...c };
          for (const [code, series] of entries) next[`${code}:${days}`] = series;
          return next;
        });
      })
      .catch(() => !cancelled && setError(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [selected, days, cache]);

  const toggle = (code: string) => {
    setSelected((sel) => {
      if (sel.includes(code)) {
        return sel.length > MIN_SELECTED ? sel.filter((c) => c !== code) : sel;
      }
      return sel.length < MAX_SELECTED ? [...sel, code] : sel;
    });
  };

  // Normaliza cada série para base 100 no início do período e mescla por data.
  const { rows, summary } = useMemo(() => {
    const merged = new Map<string, MergedRow>();
    const summary: { code: string; nome: string; change: number; color: string }[] = [];
    selected.forEach((code) => {
      const series = cache[`${code}:${days}`];
      if (!series || series.length < 2) return;
      const base = series[0].bid;
      if (base <= 0) return;
      for (const p of series) {
        const row =
          merged.get(p.date) ?? ({ date: p.date, timestamp: p.timestamp } as MergedRow);
        row[code] = (p.bid / base) * 100;
        merged.set(p.date, row);
      }
      const meta = CURRENCIES.find((c) => c.code === code)!;
      summary.push({
        code,
        nome: meta.nome,
        change: ((series[series.length - 1].bid - base) / base) * 100,
        color: meta.color,
      });
    });
    const rows = [...merged.values()].sort((a, b) => a.timestamp - b.timestamp);
    return { rows, summary };
  }, [selected, days, cache]);

  return (
    <div className="space-y-4">
      {/* Seleção aberta, sem caixa — os chips já são autocontidos */}
      <div>
        <p className="text-sm text-ink-3" id="selecao-moedas">
          Escolha de {MIN_SELECTED} a {MAX_SELECTED} moedas:
        </p>
        <div
          role="group"
          aria-labelledby="selecao-moedas"
          className="mt-3 flex flex-wrap gap-2"
        >
          {CURRENCIES.map((c) => {
            const isSelected = selected.includes(c.code);
            const disabled =
              (!isSelected && selected.length >= MAX_SELECTED) ||
              (isSelected && selected.length <= MIN_SELECTED);
            return (
              <button
                key={c.code}
                type="button"
                aria-pressed={isSelected}
                disabled={disabled}
                title={
                  disabled
                    ? isSelected
                      ? `Mínimo de ${MIN_SELECTED} moedas`
                      : `Máximo de ${MAX_SELECTED} moedas`
                    : undefined
                }
                onClick={() => toggle(c.code)}
                style={isSelected ? { color: c.color, backgroundColor: `${c.color}1f` } : undefined}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  isSelected
                    ? "font-medium"
                    : "bg-white/5 text-ink-2 hover:bg-white/10 hover:text-ink"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                {c.code} · {c.nome}
              </button>
            );
          })}
        </div>
      </div>

      <GlassPanel className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xs font-medium uppercase tracking-widest text-ink-3">
            Base 100 no início do período
          </h2>
          <PeriodToggle value={days} onChange={setDays} />
        </div>

        {summary.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {summary.map((s) => (
              <li key={s.code} className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-ink-2">{s.nome}</span>
                <span className={`tabular font-medium ${s.change >= 0 ? "text-pos" : "text-neg"}`}>
                  {formatPct(s.change)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div
          className={`mt-4 h-[320px] transition-opacity ${loading ? "opacity-50" : ""}`}
          aria-busy={loading}
        >
          {rows.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d: string) => formatShortDate(new Date(`${d}T12:00:00-03:00`))}
                  tick={{ fill: "var(--color-ink-3)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={32}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tickFormatter={(v: number) => formatNumber(v, 0)}
                  tick={{ fill: "var(--color-ink-3)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  content={<CompareTooltip rows={rows} />}
                  cursor={{ stroke: "rgba(255,255,255,0.15)" }}
                />
                {summary.map((s) => (
                  <Line
                    key={s.code}
                    type="monotone"
                    dataKey={s.code}
                    stroke={s.color}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                    isAnimationActive={!reducedMotion}
                    animationDuration={600}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : error ? (
            <p className="flex h-full items-center justify-center text-sm text-ink-2">
              As moedas recusaram-se a ser comparadas. Tente de novo em instantes.
            </p>
          ) : (
            <p className="flex h-full items-center justify-center text-sm text-ink-3" role="status">
              Carregando séries…
            </p>
          )}
        </div>
      </GlassPanel>
    </div>
  );
}
