"use client";

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

export default function PeriodToggle({ value, onChange }: PeriodToggleProps) {
  return (
    // Controle simples, sem vidro: vidro dentro de vidro vira caixa na caixa.
    <div
      role="group"
      aria-label="Período do gráfico"
      className="inline-flex rounded-full bg-white/5 p-1"
    >
      {PERIODS.map((p) => (
        <button
          key={p.days}
          type="button"
          aria-pressed={value === p.days}
          onClick={() => onChange(p.days)}
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            value === p.days
              ? "bg-pos/15 text-pos"
              : "text-ink-2 hover:bg-white/5 hover:text-ink"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
