"use client";

import { Liquid } from "liquid-gooey";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

export const PERIODS = [
  { days: 7, label: "7d" },
  { days: 30, label: "30d" },
  { days: 90, label: "90d" },
  { days: 365, label: "1a" },
] as const;

export type PeriodDays = (typeof PERIODS)[number]["days"];

interface PeriodToggleProps {
  value: PeriodDays;
  onChange: (days: PeriodDays) => void;
}

// Segmentos de largura fixa: o indicador líquido só precisa de um translateX
// por índice. Mantenha em sincronia com `w-12` / `h-7` / `rounded-[14px]`.
const SEGMENT_WIDTH = 48;

export default function PeriodToggle({ value, onChange }: PeriodToggleProps) {
  const reducedMotion = usePrefersReducedMotion();
  const activeIndex = PERIODS.findIndex((p) => p.days === value);

  const buttons = PERIODS.map((p) => {
    const active = p.days === value;
    return (
      <button
        key={p.days}
        type="button"
        aria-pressed={active}
        onClick={() => onChange(p.days)}
        className={`relative h-7 w-12 rounded-[14px] text-sm font-medium transition-colors ${
          active
            ? `text-pos ${reducedMotion ? "bg-pos-deep" : ""}`
            : "text-ink-2 hover:bg-white/5 hover:text-ink"
        }`}
      >
        {p.label}
      </button>
    );
  });

  return (
    // Controle simples, sem vidro: vidro dentro de vidro vira caixa na caixa.
    <div
      role="group"
      aria-label="Período do gráfico"
      className="inline-flex rounded-full bg-white/5 p-1"
    >
      {reducedMotion ? (
        // O efeito "move" não respeita prefers-reduced-motion: sem ele, o
        // indicador simplesmente troca de lugar (fundo sólido no ativo).
        buttons
      ) : (
        <Liquid
          className="inline-flex"
          fill="var(--color-pos-deep)"
          blur={5}
          contrast={28}
          shadow="0 2px 6px rgba(0, 0, 0, 0.25)"
        >
          {/* Indicador transparente: o líquido (SVG atrás do conteúdo) segue o retângulo dele */}
          <Liquid.Item
            effect="move"
            radius={14}
            move={{ springiness: 0.6, wobble: 0.25, stretch: 0.4, trail: 0.15 }}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 h-7 w-12"
              style={{
                transform: `translateX(${activeIndex * SEGMENT_WIDTH}px)`,
                transition: "transform 260ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            />
          </Liquid.Item>
          {buttons}
        </Liquid>
      )}
    </div>
  );
}
