import type { BovespaQuote } from "@/lib/awesomeapi";
import { formatNumber } from "@/lib/format";
import CurrencyIcon from "./CurrencyIcon";
import DeltaChip from "./DeltaChip";

/** Linha opcional do índice — só é renderizada quando o brapi.dev respondeu. */
export default function BovespaRow({ quote }: { quote: BovespaQuote }) {
  return (
    <div className="flex items-center gap-3 px-6 py-3 sm:px-8">
      <CurrencyIcon symbol="◆" color="#d6dee2" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">Índice Bovespa</span>
        <span className="block text-xs text-ink-3">pontos</span>
      </span>
      <span className="flex flex-col items-end gap-1">
        <span className="tabular text-base leading-none">
          {formatNumber(quote.points, 0)}
        </span>
        <DeltaChip pct={quote.pctChange} />
      </span>
    </div>
  );
}
