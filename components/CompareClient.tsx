"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { CURRENCIES, type DailyPoint } from "@/lib/awesomeapi";
import { formatPct } from "@/lib/format";
import { isGoodChange } from "@/lib/tone";
import PeriodToggle, { type PeriodDays } from "./PeriodToggle";
import GlassPanel from "./GlassPanel";
import type { CompareRow } from "./CompareChart";

// Recharts só quando há o que desenhar (ver CompareChart). O espaço do
// gráfico é fixo (320px), então a troca não desloca nada na página.
const CompareChart = dynamic(() => import("./CompareChart"), {
  ssr: false,
  loading: () => (
    <p className="flex h-full items-center justify-center text-sm text-ink-3" role="status">
      Carregando gráfico…
    </p>
  ),
});

const MAX_SELECTED = 4;
const MIN_SELECTED = 2;

type SeriesCache = Record<string, DailyPoint[]>; // chave: `${code}:${days}`

export default function CompareClient() {
  const [selected, setSelected] = useState<string[]>(["USD", "EUR"]);
  const [days, setDays] = useState<PeriodDays>(30);
  const [cache, setCache] = useState<SeriesCache>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

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
    const merged = new Map<string, CompareRow>();
    const summary: { code: string; nome: string; change: number; color: string }[] = [];
    selected.forEach((code) => {
      const series = cache[`${code}:${days}`];
      if (!series || series.length < 2) return;
      const base = series[0].bid;
      if (base <= 0) return;
      for (const p of series) {
        const row =
          merged.get(p.date) ?? ({ date: p.date, timestamp: p.timestamp } as CompareRow);
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
        {/* Celular: uma fileira rolável para o lado (9 chips quebrados em
            várias linhas empurravam o gráfico para fora da tela). */}
        <div
          role="group"
          aria-labelledby="selecao-moedas"
          className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
        >
          {CURRENCIES.map((c) => {
            const isSelected = selected.includes(c.code);
            // Só esmaece o que não dá para adicionar. Selecionadas no mínimo
            // continuam com cara de selecionadas: o toque só não faz nada.
            const cantAdd = !isSelected && selected.length >= MAX_SELECTED;
            const cantRemove = isSelected && selected.length <= MIN_SELECTED;
            return (
              <button
                key={c.code}
                type="button"
                aria-pressed={isSelected}
                aria-disabled={cantRemove || undefined}
                disabled={cantAdd}
                title={
                  cantAdd
                    ? `Máximo de ${MAX_SELECTED} moedas`
                    : cantRemove
                      ? `Mínimo de ${MIN_SELECTED} moedas`
                      : undefined
                }
                onClick={() => toggle(c.code)}
                style={isSelected ? { color: c.color, backgroundColor: `${c.color}1f` } : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-sm transition-colors active:opacity-70 disabled:cursor-not-allowed disabled:opacity-40 ${
                  isSelected
                    ? "font-medium"
                    : "bg-white/5 text-ink-2 md:hover:bg-white/10 md:hover:text-ink"
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
                <span className={`tabular font-medium ${isGoodChange(s.change) ? "text-pos" : "text-neg"}`}>
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
            <CompareChart rows={rows} series={summary} />
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
