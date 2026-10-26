import TransitionLink from "./TransitionLink";
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

/**
 * Linha no estilo do app Ações: código em destaque, nome embaixo, sparkline
 * no meio e preço com a pílula de variação à direita. O separador (`.row-sep`)
 * começa depois do ícone, como nas listas agrupadas do iOS; quem decide qual
 * linha não leva separador é a lista (ver page.tsx).
 */
export default function RateRow({ meta, rate, spark }: RateRowProps) {
  const value = rate ? rate.bid * meta.lote : null;
  const pct = rate?.pctChange ?? null;

  return (
    <TransitionLink
      nav="push"
      currency={meta.slug}
      href={`/moeda/${meta.slug}`}
      className="flex items-center gap-3 pl-4 transition-colors active:bg-white/[0.06] md:hover:bg-white/[0.04]"
      aria-label={`${meta.nome}: ver histórico`}
    >
      <CurrencyIcon code={meta.code} color={meta.color} vtKey={meta.slug} />
      <span className="row-sep flex min-w-0 flex-1 items-center gap-3 border-t border-white/[0.07] py-3 pr-4">
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-headline font-semibold">
            {meta.code}
            {/* O lote explica o preço (JPY/ARS por 100, KRW por 1000): fica junto
                do código, onde não é cortado como seria no fim do nome. */}
            {meta.lote > 1 && (
              <>
                <span
                  aria-hidden="true"
                  className="rounded bg-white/[0.08] px-1 py-px text-[11px] font-medium text-ink-2"
                >
                  ×{meta.lote}
                </span>
                <span className="sr-only">{meta.loteLabel}</span>
              </>
            )}
          </span>
          <span className="block truncate text-footnote text-ink-3">{meta.nome}</span>
        </span>
        {spark && spark.length > 1 && (
          <Sparkline
            data={spark}
            width={56}
            height={26}
            tone={pct === null ? "neutral" : pct >= 0 ? "pos" : "neg"}
          />
        )}
        <span className="flex flex-col items-end gap-1">
          <span className="tabular text-body leading-none" data-vt-price={meta.slug}>
            {value !== null ? formatBRL(value, meta.decimals) : "—"}
          </span>
          {pct !== null ? (
            <DeltaChip pct={pct} solid />
          ) : (
            <span className="text-xs text-ink-3">sem dados</span>
          )}
        </span>
      </span>
    </TransitionLink>
  );
}
