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

/** Metade "humor" do herói da home — sem painel próprio, vive dentro dele. */
export default function MoodCard({ mood, series }: MoodCardProps) {
  const bids = series.map((p) => p.bid);

  return (
    <div className="flex h-full flex-col justify-between gap-4">
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
            className={`font-display text-xl font-medium leading-tight sm:text-2xl ${MOOD_TONE[mood.id]}`}
          >
            {mood.label}
          </h2>
          <p className="mt-0.5 text-sm text-ink-2">{mood.caption}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <span className="flex items-center gap-2 text-ink-3">
          Hoje <DeltaChip pct={mood.todayChange} />
        </span>
        <span className="text-ink-3">
          Volatilidade 30d{" "}
          <span className="tabular text-ink-2">{formatNumber(mood.volatility)} p.p.</span>
        </span>
        {bids.length > 1 && (
          <span className="ml-auto" aria-label="Evolução do dólar nos últimos 30 dias">
            <Sparkline data={bids} width={110} height={30} />
          </span>
        )}
      </div>
    </div>
  );
}
