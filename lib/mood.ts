import type { DailyPoint } from "./awesomeapi";
import { TIMEZONE } from "./format";

// O Índice de Humor do Dólar: matemática de volatilidade + o mapa de humores
// que dá personalidade à marca. Limiares em pontos percentuais.

export const MOOD_THRESHOLDS = {
  /** todayChange acima disso: Mania */
  mania: 1.2,
  /** todayChange abaixo disso: Depressivo */
  depressivo: -1.2,
  /** todayChange abaixo disso: Pra baixo */
  praBaixo: -0.6,
  /** volatilidade acima + |todayChange| acima: Agitado */
  agitadoVol: 0.8,
  agitadoChange: 0.4,
  /** volatilidade e |todayChange| até aqui: Estável */
  estavelVol: 0.5,
  estavelChange: 0.3,
} as const;

/** Dias com variação diária além disso ganham marcador de notícia no gráfico. */
export const NEWS_SPIKE_THRESHOLD = 0.7;

export type MoodId = "mania" | "agitado" | "estavel" | "baixa" | "depressivo";

export interface MoodDef {
  id: MoodId;
  nome: string;
  label: string;
  captions: string[];
}

export const MOODS: Record<MoodId, MoodDef> = {
  mania: {
    id: "mania",
    nome: "Mania",
    label: "Em surto de alta",
    captions: [
      "Acordou decidido a assustar todo mundo.",
      "Subiu no telhado e recusa negociação.",
      "Ninguém sabe o motivo. Ele também não.",
      "Energia de quem tomou três cafés e leu uma manchete.",
    ],
  },
  agitado: {
    id: "agitado",
    nome: "Agitado",
    label: "Instável, evite contato",
    captions: [
      "Melhor não perguntar como ele está.",
      "Mudou de opinião quatro vezes desde o almoço.",
      "Oscilando mais que sinal de wi-fi de rodoviária.",
      "Hoje ele reage a qualquer estímulo. Qualquer um.",
    ],
  },
  estavel: {
    id: "estavel",
    nome: "Estável",
    label: "Medicado e funcional",
    captions: [
      "Tomou os remédios e foi trabalhar.",
      "Um dia atipicamente razoável.",
      "Em paz consigo mesmo. Por enquanto.",
      "Estável. Desconfie, mas aproveite.",
    ],
  },
  baixa: {
    id: "baixa",
    nome: "Pra baixo",
    label: "Numa fase down",
    captions: [
      "Acordou meio pra baixo e não quis conversar.",
      "Está se reavaliando como moeda.",
      "Precisando de um tempo longe dos holofotes.",
      "Desceu para refletir. Volta quando quiser.",
    ],
  },
  depressivo: {
    id: "depressivo",
    nome: "Depressivo",
    label: "Caindo e chorando",
    captions: [
      "Chorando no banheiro do mercado financeiro.",
      "Hoje não. Hoje ele só cai.",
      "Em queda livre e sentimental.",
      "Alguém arruma um copo d'água pra ele.",
    ],
  },
};

export interface MoodResult {
  id: MoodId;
  nome: string;
  label: string;
  caption: string;
  /** variação % de hoje vs. fechamento de ontem */
  todayChange: number;
  /** desvio-padrão das variações diárias dos últimos 30 dias, em p.p. */
  volatility: number;
}

function stdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function pickMood(todayChange: number, volatility: number): MoodId {
  const t = MOOD_THRESHOLDS;
  if (todayChange < t.depressivo) return "depressivo";
  if (todayChange > t.mania) return "mania";
  if (todayChange < t.praBaixo) return "baixa";
  if (volatility > t.agitadoVol && Math.abs(todayChange) > t.agitadoChange) return "agitado";
  if (volatility <= t.estavelVol && Math.abs(todayChange) <= t.estavelChange) return "estavel";
  // Zona cinzenta entre "agitado" e "estável": desempata pela volatilidade.
  return volatility > (t.agitadoVol + t.estavelVol) / 2 ? "agitado" : "estavel";
}

/** Legenda rotaciona por dia (determinística: SSR e cliente rendem igual). */
function captionOfTheDay(def: MoodDef, now: Date): string {
  const day = parseInt(
    new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone: TIMEZONE }).format(now),
    10
  );
  return def.captions[day % def.captions.length];
}

/** Computa o humor a partir da série diária (mais antigo → mais recente). */
export function computeMood(series: DailyPoint[], now: Date = new Date()): MoodResult {
  const dailyChanges: number[] = [];
  for (let i = 1; i < series.length; i++) {
    const prev = series[i - 1].bid;
    if (prev > 0) dailyChanges.push(((series[i].bid - prev) / prev) * 100);
  }
  const volatility = stdDev(dailyChanges);
  const todayChange = dailyChanges.length > 0 ? dailyChanges[dailyChanges.length - 1] : 0;

  const def = MOODS[pickMood(todayChange, volatility)];
  return {
    id: def.id,
    nome: def.nome,
    label: def.label,
    caption: captionOfTheDay(def, now),
    todayChange,
    volatility,
  };
}
