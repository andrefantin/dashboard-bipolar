import { IconArrowDownRight, IconArrowUpRight } from "@tabler/icons-react";
import { formatPct } from "@/lib/format";

// Variação do dia como "pílula" com fundo suave — cor comunica a direção,
// sem depender de negrito.
interface DeltaChipProps {
  pct: number;
  /** tamanho maior para o número-herói */
  large?: boolean;
  className?: string;
}

export default function DeltaChip({ pct, large = false, className = "" }: DeltaChipProps) {
  const up = pct >= 0;
  const Arrow = up ? IconArrowUpRight : IconArrowDownRight;
  return (
    <span
      className={`tabular inline-flex items-center gap-0.5 rounded-full font-medium ${
        up ? "bg-pos/10 text-pos" : "bg-neg/10 text-neg"
      } ${large ? "px-2.5 py-1 text-sm" : "px-2 py-0.5 text-xs"} ${className}`}
    >
      <Arrow size={large ? 15 : 12} stroke={2.5} aria-hidden="true" />
      {formatPct(pct)}
      <span className="sr-only">{up ? "de alta" : "de queda"} hoje</span>
    </span>
  );
}
