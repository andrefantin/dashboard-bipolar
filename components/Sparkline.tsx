// Sparkline SVG leve, renderizável no servidor — sem lib de gráfico.
interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  /** força a cor; por padrão deriva da tendência (fim vs. início) */
  tone?: "pos" | "neg" | "neutral";
}

export default function Sparkline({ data, width = 96, height = 28, tone }: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 2;
  const step = (width - pad * 2) / (data.length - 1);
  const points = data
    .map((v, i) => {
      const x = pad + i * step;
      const y = pad + (1 - (v - min) / range) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const trend = tone ?? (data[data.length - 1] >= data[0] ? "pos" : "neg");
  const stroke =
    trend === "pos"
      ? "var(--color-pos)"
      : trend === "neg"
        ? "var(--color-neg)"
        : "var(--color-ink-3)";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      className="shrink-0"
    >
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
    </svg>
  );
}
