"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyPoint } from "@/lib/awesomeapi";
import { formatBRL, formatLongDate, formatNumber, formatShortDate } from "@/lib/format";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

interface RateChartProps {
  data: DailyPoint[];
  lote?: number;
  decimals?: number;
  height?: number;
  /** datas (yyyy-mm-dd) que ganham marcador clicável no gráfico */
  markerDates?: string[];
  selectedDate?: string | null;
  onSelectDate?: (date: string | null) => void;
}

interface Row {
  date: string;
  timestamp: number;
  value: number;
  pctChange: number;
}

function ChartTooltip({
  active,
  payload,
  decimals,
  hasMarker,
}: {
  active?: boolean;
  payload?: { payload: Row }[];
  decimals: number;
  hasMarker: (date: string) => boolean;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="glass-raised px-3 py-2 text-sm">
      <p className="text-xs text-ink-3">{formatLongDate(new Date(row.timestamp))}</p>
      <p className="tabular font-medium">{formatBRL(row.value, decimals)}</p>
      {hasMarker(row.date) && (
        <p className="mt-0.5 text-xs text-warm">● toque para ver as manchetes</p>
      )}
    </div>
  );
}

export default function RateChart({
  data,
  lote = 1,
  decimals = 2,
  height = 240,
  markerDates,
  selectedDate,
  onSelectDate,
}: RateChartProps) {
  const reducedMotion = usePrefersReducedMotion();

  const rows = useMemo<Row[]>(
    () =>
      data.map((p) => ({
        date: p.date,
        timestamp: p.timestamp,
        value: p.bid * lote,
        pctChange: p.pctChange,
      })),
    [data, lote]
  );

  const markerSet = useMemo(() => new Set(markerDates ?? []), [markerDates]);

  const axisFormat = (v: number) =>
    v >= 10_000
      ? new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(v)
      : formatNumber(v, decimals);

  const toggleDate = (date: string) =>
    onSelectDate?.(selectedDate === date ? null : date);

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={rows}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          onClick={(state) => {
            const label = state?.activeLabel;
            if (typeof label === "string" && markerSet.has(label)) toggleDate(label);
          }}
        >
          <defs>
            <linearGradient id="rateFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-pos)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--color-pos)" stopOpacity={0} />
            </linearGradient>
          </defs>
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
            tickFormatter={axisFormat}
            tick={{ fill: "var(--color-ink-3)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={54}
          />
          <Tooltip
            content={<ChartTooltip decimals={decimals} hasMarker={(d) => markerSet.has(d)} />}
            cursor={{ stroke: "rgba(255,255,255,0.15)" }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--color-pos)"
            strokeWidth={2}
            fill="url(#rateFill)"
            isAnimationActive={!reducedMotion}
            animationDuration={600}
            dot={(props: unknown) => {
              const { cx, cy, payload, index } = props as {
                cx?: number;
                cy?: number;
                payload: Row;
                index: number;
              };
              if (cx === undefined || cy === undefined || !markerSet.has(payload.date)) {
                return <g key={`d-${index}`} />;
              }
              const isSelected = selectedDate === payload.date;
              return (
                <g
                  key={`d-${index}`}
                  style={{ cursor: "pointer" }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Ver manchetes de ${formatShortDate(new Date(`${payload.date}T12:00:00-03:00`))}`}
                  aria-pressed={isSelected}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDate(payload.date);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleDate(payload.date);
                    }
                  }}
                >
                  {/* área de toque generosa para dedos */}
                  <circle cx={cx} cy={cy} r={14} fill="transparent" />
                  {isSelected && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={9}
                      fill="none"
                      stroke="var(--color-warm)"
                      strokeWidth={1.5}
                      opacity={0.7}
                    />
                  )}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={4.5}
                    fill="var(--color-warm)"
                    stroke="var(--color-bg)"
                    strokeWidth={1.5}
                  />
                </g>
              );
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
