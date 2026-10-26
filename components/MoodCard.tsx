import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import type { MoodResult } from "@/lib/mood";
import type { DailyPoint } from "@/lib/awesomeapi";
import { formatNumber } from "@/lib/format";
import Sparkline from "./Sparkline";
import DeltaChip from "./DeltaChip";

interface MoodCardProps {
  mood: MoodResult;
  series: DailyPoint[];
}

/** Usa a variante do mascote por humor quando o asset existir;
 *  até lá, o avatar flamejante original serve para os cinco. */
function mascotSrc(moodId: string): string {
  const perMood = path.join(process.cwd(), "public", "mascote", `${moodId}.png`);
  return fs.existsSync(perMood) ? `/mascote/${moodId}.png` : "/mascote/default.webp";
}

const MOOD_TONE: Record<string, string> = {
  mania: "text-warm/90",
  agitado: "text-warm/90",
  estavel: "text-pos/90",
  baixa: "text-cool/90",
  depressivo: "text-cool/90",
};

/** Conteúdo do card de humor (estilo widget do iOS); o painel de vidro
 *  em volta é da página. */
export default function MoodCard({ mood, series }: MoodCardProps) {
  const bids = series.map((p) => p.bid);

  return (
    <div className="flex h-full flex-col justify-between gap-5">
      <div className="flex items-center gap-4">
        <Image
          src={mascotSrc(mood.id)}
          alt=""
          width={56}
          height={56}
          priority
          className="rounded-2xl"
        />
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-widest text-ink-3">
            Índice de Humor do Dólar
          </p>
          <h2
            className={`font-display text-title3 font-medium ${MOOD_TONE[mood.id]}`}
          >
            {mood.label}
          </h2>
          <p className="mt-0.5 text-sm text-ink-2">{mood.caption}</p>
        </div>
      </div>

      {/* Rótulo em cima, valor embaixo: cabe em uma linha até 360px */}
      <div className="flex items-end gap-6">
        <dl className="flex gap-6 text-sm">
          <div>
            <dt className="text-xs text-ink-3">Hoje</dt>
            <dd className="mt-1">
              <DeltaChip pct={mood.todayChange} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-3">Volatilidade 30d</dt>
            <dd className="tabular mt-1 text-ink-2">{formatNumber(mood.volatility)} p.p.</dd>
          </div>
        </dl>
        {bids.length > 1 && (
          <span className="ml-auto" aria-label="Evolução do dólar nos últimos 30 dias">
            <Sparkline data={bids} width={88} height={30} />
          </span>
        )}
      </div>
    </div>
  );
}
