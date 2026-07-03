import Link from "next/link";
import type { CurrencyMeta, Rate } from "@/lib/awesomeapi";
import { formatBRL } from "@/lib/format";
import Sparkline from "./Sparkline";
import CurrencyIcon from "./CurrencyIcon";
import DeltaChip from "./DeltaChip";

interface RateRowProps {
  meta: CurrencyMeta;
  rate?: Rate;
  /** últimos ~7 dias, por unidade */
  spark?: number[];
}

export default function RateRow({ meta, rate, spark }: RateRowProps) {
  const value = rate ? rate.bid * meta.lote : null;
  const pct = rate?.pctChange ?? null;

  return (
    <Link
      href={`/moeda/${meta.slug}`}
      className="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-white/[0.04] sm:px-8"
      aria-label={`${meta.nome}: ver histórico`}
    >
      <CurrencyIcon symbol={meta.symbol} color={meta.color} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{meta.nome}</span>
        <span className="block text-xs text-ink-3">{meta.loteLabel ?? meta.code}</span>
      </span>
      {spark && spark.length > 1 && (
        <span className="hidden opacity-70 sm:block">
          <Sparkline
            data={spark}
            width={72}
            height={24}
            tone={pct === null ? "neutral" : pct >= 0 ? "pos" : "neg"}
          />
        </span>
      )}
      <span className="flex flex-col items-end gap-1">
        <span className="tabular text-base leading-none">
          {value !== null ? formatBRL(value, meta.decimals) : "—"}
        </span>
        {pct !== null ? (
          <DeltaChip pct={pct} />
        ) : (
          <span className="text-xs text-ink-3">sem dados</span>
        )}
      </span>
    </Link>
  );
}
