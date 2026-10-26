import type { BovespaQuote } from "@/lib/awesomeapi";
import { formatNumber } from "@/lib/format";
import CurrencyIcon from "./CurrencyIcon";
import DeltaChip from "./DeltaChip";

/** Linha opcional do índice — só é renderizada quando o brapi.dev respondeu.
 *  Mesma anatomia do RateRow (separador `.row-sep` depois do ícone). */
export default function BovespaRow({ quote }: { quote: BovespaQuote }) {
  return (
    <div className="flex items-center gap-3 pl-4">
      <CurrencyIcon code="IBOV" color="#d6dee2" />
      <span className="row-sep flex min-w-0 flex-1 items-center gap-3 border-t border-white/[0.07] py-3 pr-4">
        <span className="min-w-0 flex-1">
          <span className="block text-headline font-semibold">IBOV</span>
          <span className="block truncate text-footnote text-ink-3">Índice Bovespa · pontos</span>
        </span>
        <span className="flex flex-col items-end gap-1">
          <span className="tabular text-body leading-none">{formatNumber(quote.points, 0)}</span>
          <DeltaChip pct={quote.pctChange} solid />
        </span>
      </span>
    </div>
  );
}
