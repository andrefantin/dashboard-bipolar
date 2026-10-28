import { IconArrowDownRight, IconArrowUpRight } from "@tabler/icons-react";
import { formatPct } from "@/lib/format";
import { isGoodChange, type GoodWhen } from "@/lib/tone";

// Variação do dia como "pílula". Duas formas:
// - suave (padrão): fundo a 10%, para o número-herói e o card de humor;
// - sólida: verde/vermelho cheio com texto escuro, como no app Ações do iOS —
//   nas listas, onde a direção precisa ser lida de relance, linha a linha.
interface DeltaChipProps {
  pct: number;
  /** tamanho maior para o número-herói */
  large?: boolean;
  solid?: boolean;
  /** quando a variação é boa para o leitor (ver lib/tone); "up" só na Bovespa */
  goodWhen?: GoodWhen;
  className?: string;
}

export default function DeltaChip({ pct, large = false, solid = false, goodWhen = "down", className = "" }: DeltaChipProps) {
  const up = pct >= 0;
  // Cor pelo leitor (moeda mais barata = verde); a seta segue a direção real
  const good = isGoodChange(pct, goodWhen);
  const Arrow = up ? IconArrowUpRight : IconArrowDownRight;

  const look = solid
    ? `min-w-[4.75rem] justify-center rounded-md px-1.5 py-0.5 text-footnote font-semibold text-bg ${
        good ? "bg-pos" : "bg-neg"
      }`
    : `rounded-full font-medium ${good ? "bg-pos/10 text-pos" : "bg-neg/10 text-neg"} ${
        large ? "px-2.5 py-1 text-sm" : "px-2 py-0.5 text-xs"
      }`;

  return (
    <span className={`tabular inline-flex items-center gap-0.5 ${look} ${className}`}>
      <Arrow size={large ? 15 : 12} stroke={2.5} aria-hidden="true" />
      {formatPct(pct)}
      <span className="sr-only">{up ? "de alta" : "de queda"} hoje</span>
    </span>
  );
}
