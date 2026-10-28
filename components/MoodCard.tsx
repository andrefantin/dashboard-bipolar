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

/** Mascote de corpo inteiro do card. Uma variante por humor entra sozinha ao
 *  existir em public/mascote/humor-{mood}.webp (ou .png) no próximo deploy (a
 *  lista é montada no build, ver next.config); até lá, humor.webp serve para
 *  os cinco. As imagens vão recortadas rente à figura, sem margem
 *  transparente, para alinharem com a grade do card. */
const MOOD_MASCOTS = (process.env.MOOD_MASCOTS ?? "").split(",").filter(Boolean);

function mascotSrc(moodId: string): string {
  for (const ext of ["webp", "png"]) {
    const file = `humor-${moodId}.${ext}`;
    if (MOOD_MASCOTS.includes(file)) return `/mascote/${file}`;
  }
  return "/mascote/humor.webp";
}

const MOOD_TONE: Record<string, string> = {
  mania: "text-warm/90",
  agitado: "text-warm/90",
  estavel: "text-pos/90",
  baixa: "text-cool/90",
  depressivo: "text-cool/90",
};

/** Conteúdo do card de humor (estilo widget do iOS); o painel de vidro
 *  em volta é da página. Grade de duas colunas: o mascote ocupa 24% da
 *  largura e o texto o resto; embaixo, "Hoje" fica na coluna do mascote e a
 *  volatilidade + sparkline na do texto, alinhados com o título. */
export default function MoodCard({ mood, series }: MoodCardProps) {
  const bids = series.map((p) => p.bid);

  return (
    <div className="grid grid-cols-[24%_1fr] gap-x-[4.5%] gap-y-4">
      <Image
        src={mascotSrc(mood.id)}
        alt=""
        width={930}
        height={1100}
        priority
        sizes="(min-width: 1024px) 120px, 24vw"
        className="h-auto w-full self-start"
      />
      <div className="min-w-0 self-start pt-2">
        <p className="text-caption1 font-medium uppercase tracking-widest text-ink-3">
          Índice de Humor do Dólar
        </p>
        <h2 className={`mt-0.5 font-display text-title3 font-medium ${MOOD_TONE[mood.id]}`}>
          {mood.label}
        </h2>
        <p className="mt-1 text-subhead text-ink-2">{mood.caption}</p>
      </div>

      <dl>
        <dt className="text-xs text-ink-3">Hoje</dt>
        <dd className="mt-1">
          <DeltaChip pct={mood.todayChange} />
        </dd>
      </dl>
      <div className="flex min-w-0 items-end justify-between gap-4">
        <dl>
          <dt className="text-xs text-ink-3">Volatilidade 30d</dt>
          <dd className="tabular mt-1 text-subhead text-ink-2">
            {formatNumber(mood.volatility)} p.p.
          </dd>
        </dl>
        {bids.length > 1 && (
          <span role="img" aria-label="Evolução do dólar nos últimos 30 dias">
            <Sparkline data={bids} width={96} height={30} />
          </span>
        )}
      </div>
    </div>
  );
}
