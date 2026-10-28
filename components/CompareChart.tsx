"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatLongDate, formatNumber, formatShortDate } from "@/lib/format";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

// Só o desenho do gráfico de comparação, em arquivo próprio para o
// CompareClient carregá-lo sob demanda: assim o Recharts (~105 KB) sai do
// bundle da rota e o prefetch que a home faz de /comparar não o arrasta junto.

export interface CompareRow {
  date: string;
  timestamp: number;
  [code: string]: string | number | null;
}

export interface CompareSeries {
  code: string;
  color: string;
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
  rows: CompareRow[];
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

export default function CompareChart({ rows, series }: { rows: CompareRow[]; series: CompareSeries[] }) {
  const reducedMotion = usePrefersReducedMotion();
  return (
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
        {series.map((s) => (
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
  );
}
