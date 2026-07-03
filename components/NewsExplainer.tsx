"use client";

import { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  IconArrowUpRight,
  IconChartLine,
  IconNews,
  IconX,
} from "@tabler/icons-react";
import type { DailyPoint } from "@/lib/awesomeapi";
import { NEWS_SPIKE_THRESHOLD } from "@/lib/mood";
import { groupNewsByDay, type NewsItem } from "@/lib/news";
import { formatNumber, formatShortDate, relativeTime } from "@/lib/format";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

// O gráfico (Recharts, ~100 kB) só é baixado quando o modal abre pela
// primeira vez — a home carrega sem ele.
const RateChart = dynamic(() => import("./RateChart"), {
  ssr: false,
  loading: () => (
    <p className="flex h-[200px] items-center justify-center text-sm text-ink-3" role="status">
      Carregando gráfico…
    </p>
  ),
});

interface NewsExplainerProps {
  news: NewsItem[];
  /** série diária USD-BRL de ~30 dias, mais antigo → mais recente */
  series: DailyPoint[];
  newsFailed?: boolean;
}

function NewsLink({ item }: { item: NewsItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl px-3 py-2.5 transition-colors hover:bg-white/5"
    >
      <p className="text-xs text-ink-3">
        <span className="font-medium text-ink-2">{item.source}</span>
        {" · "}
        <time dateTime={item.publishedAt} suppressHydrationWarning>
          {relativeTime(item.publishedAt)}
        </time>
      </p>
      <p className="mt-0.5 text-sm leading-snug text-ink group-hover:underline">
        {item.title}
        <IconArrowUpRight
          size={14}
          aria-hidden="true"
          className="ml-1 inline-block align-[-2px] text-ink-3 transition-transform group-hover:translate-x-0.5"
        />
      </p>
    </a>
  );
}

/** Letreiro de manchetes + modal "Por que o dólar está assim?".
 *  O letreiro mora perto do topo; a análise só aparece quando pedida. */
export default function NewsExplainer({ news, series, newsFailed = false }: NewsExplainerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [hasOpened, setHasOpened] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  const buckets = useMemo(() => groupNewsByDay(news), [news]);
  // Dias com movimento forte (±0,7%) ganham marcador — o "porquê" clicável.
  const markerDates = useMemo(
    () =>
      series
        .filter((p) => Math.abs(p.pctChange) > NEWS_SPIKE_THRESHOLD)
        .map((p) => p.date),
    [series]
  );

  const tickerItems = news.slice(0, 12);
  const selectedItems = selectedDate ? (buckets[selectedDate] ?? []) : null;
  const visible = selectedItems ?? news.slice(0, 8);

  const openModal = () => {
    setHasOpened(true);
    dialogRef.current?.showModal();
  };
  const closeModal = () => dialogRef.current?.close();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Mobile: só a manchete mais recente, estática — letreiro em tela
          pequena vira fragmento ilegível e alvo de toque em movimento. */}
      {tickerItems.length > 0 && (
        <a
          href={tickerItems[0].url}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 py-1 text-sm text-ink-2 transition-colors hover:text-ink sm:hidden"
        >
          <span className="mr-2 text-xs font-medium uppercase tracking-wide text-ink-3">
            {tickerItems[0].source}
          </span>
          <span className="line-clamp-2">{tickerItems[0].title}</span>
        </a>
      )}

      {/* Letreiro (só em telas ≥ sm) */}
      {tickerItems.length > 0 ? (
        <div
          className="ticker hidden min-w-0 flex-1 sm:block"
          aria-label="Últimas manchetes sobre o dólar"
        >
          <div
            className="ticker-track items-center gap-10"
            style={{ animationDuration: `${tickerItems.length * 8}s` }}
          >
            {/* segunda cópia só para o loop contínuo; sem animação ela é ruído */}
            {(reducedMotion ? [0] : [0, 1]).map((copy) => (
              <div
                key={copy}
                className="flex items-center gap-10"
                aria-hidden={copy === 1 || undefined}
              >
                {tickerItems.map((item) => (
                  <a
                    key={`${copy}-${item.url}`}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    tabIndex={copy === 1 ? -1 : undefined}
                    className="flex shrink-0 items-center gap-2 py-2 text-sm text-ink-2 transition-colors hover:text-ink"
                  >
                    <span className="text-xs font-medium uppercase tracking-wide text-ink-3">
                      {item.source}
                    </span>
                    <span className="max-w-[26rem] truncate">{item.title}</span>
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="min-w-0 flex-1 truncate py-1.5 text-sm text-ink-3">
          {newsFailed
            ? "As manchetes não chegaram — o dólar segue inexplicado."
            : "Sem manchetes por enquanto."}
        </p>
      )}

      {/* Gatilho do modal */}
      <button
        type="button"
        onClick={openModal}
        className="glass inline-flex shrink-0 items-center justify-center gap-2 self-start px-3.5 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:text-ink"
      >
        <IconChartLine size={16} aria-hidden="true" className="text-pos" />
        <span className="hidden md:inline">Por que o dólar está assim?</span>
        <span className="md:hidden">Entenda o dólar</span>
      </button>

      {/* Modal com gráfico + manchetes por dia */}
      <dialog
        ref={dialogRef}
        aria-label="Por que o dólar está assim?"
        className="glass-raised m-auto w-[min(94vw,44rem)] bg-transparent p-0 text-ink backdrop:bg-transparent"
        onClick={(e) => {
          if (e.target === dialogRef.current) closeModal();
        }}
      >
        {hasOpened && (
        <div className="max-h-[85dvh] overflow-y-auto p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-ink-3">
                <IconNews size={14} aria-hidden="true" />
                Notícias
              </p>
              <h2 className="mt-1 font-display text-lg font-medium">
                Por que o dólar está assim?
              </h2>
              <p className="mt-1 text-sm text-ink-3">
                Dias com variação acima de ±{formatNumber(NEWS_SPIKE_THRESHOLD, 1)}%
                ganham um ponto no gráfico — toque para ver as manchetes do dia.
              </p>
            </div>
            <button
              type="button"
              onClick={closeModal}
              aria-label="Fechar"
              className="rounded-lg p-1.5 text-ink-2 transition-colors hover:bg-white/5 hover:text-ink"
            >
              <IconX size={18} aria-hidden="true" />
            </button>
          </div>

          {series.length > 1 && (
            <div className="mt-4">
              <RateChart
                data={series}
                height={200}
                markerDates={markerDates}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
              />
            </div>
          )}

          <div className="mt-4 border-t border-white/5 pt-3">
            {selectedDate && (
              <div className="mb-2 flex items-center justify-between gap-2 px-3">
                <p className="text-sm font-medium text-warm">
                  Manchetes de {formatShortDate(new Date(`${selectedDate}T12:00:00-03:00`))}
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-ink-2 hover:bg-white/5 hover:text-ink"
                >
                  limpar
                  <IconX size={12} aria-hidden="true" />
                </button>
              </div>
            )}

            {newsFailed && news.length === 0 ? (
              <p className="px-3 py-4 text-sm text-ink-2">
                As manchetes não chegaram. O dólar segue inexplicado por enquanto —
                tente atualizar em instantes.
              </p>
            ) : visible.length === 0 ? (
              <p className="px-3 py-4 text-sm text-ink-2">
                Nenhuma manchete guardada desse dia. O dólar surtou em silêncio.
              </p>
            ) : (
              <ul className="space-y-0.5">
                {visible.map((item) => (
                  <li key={item.url}>
                    <NewsLink item={item} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        )}
      </dialog>
    </div>
  );
}
