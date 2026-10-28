import type { DailyPoint } from "./awesomeapi";
import { TIMEZONE } from "./format";

// O Índice de Humor do Dólar: matemática de volatilidade + o mapa de humores
// que dá personalidade à marca. Limiares em pontos percentuais.
//
// O humor é do ponto de vista do leitor brasileiro: dólar caindo (real
// ganhando força) deixa o mascote feliz; dólar subindo o deixa irritado e,
// numa disparada, furioso. A régua é simétrica — dois níveis para cada lado —
// e o mês agitado sem direção clara no dia vira "instável".

export const MOOD_THRESHOLDS = {
  /** variação do dia além disso (para cima ou para baixo): humor forte */
  forte: 1.2,
  /** variação do dia além disso: humor moderado */
  moderado: 0.6,
  /** volatilidade de 30 dias acima disso, num dia sem direção clara: instável */
  instavelVol: 0.65,
} as const;

/** Dias com variação diária além disso ganham marcador de notícia no gráfico. */
export const NEWS_SPIKE_THRESHOLD = 0.7;

export type MoodId = "euforico" | "feliz" | "estavel" | "irritado" | "furioso" | "instavel";

export interface MoodDef {
  id: MoodId;
  nome: string;
  label: string;
  captions: string[];
}

export const MOODS: Record<MoodId, MoodDef> = {
  euforico: {
    id: "euforico",
    nome: "Eufórico",
    label: "Em êxtase com o real",
    captions: [
      "O dólar despencou e ele já está montando o carrinho no site gringo.",
      "Viagem internacional voltou para a lista de desejos.",
      "Comemorando como se o câmbio fosse final de Copa.",
      "Hoje dá até para olhar o preço do iPhone sem chorar.",
    ],
  },
  feliz: {
    id: "feliz",
    nome: "Feliz",
    label: "De bom humor",
    captions: [
      "O dólar deu uma aliviada. Ele também.",
      "Respirando melhor com o real de pé.",
      "Sorriso discreto, para não dar azar.",
      "Um dia bom para quem paga a fatura em dólar.",
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
  irritado: {
    id: "irritado",
    nome: "Irritado",
    label: "De mau humor",
    captions: [
      "O dólar subiu e ele já desmarcou a viagem.",
      "Atualizando a fatura do cartão de cinco em cinco minutos.",
      "Bufando a cada atualização da cotação.",
      "Hoje ele não está para conversa.",
    ],
  },
  furioso: {
    id: "furioso",
    nome: "Furioso",
    label: "Furioso, evite contato",
    captions: [
      "O dólar disparou e ele está gritando com o aplicativo do banco.",
      "Quebrou o cofrinho de moedas estrangeiras de raiva.",
      "Não pergunte sobre a viagem. Nem sobre o iPhone.",
      "Fúria compatível com o IOF.",
    ],
  },
  instavel: {
    id: "instavel",
    nome: "Instável",
    label: "Instável e indeciso",
    captions: [
      "Mudou de opinião quatro vezes desde o almoço.",
      "Oscilando mais que sinal de wi-fi de rodoviária.",
      "Hoje ele reage a qualquer estímulo. Qualquer um.",
      "Melhor não perguntar como ele está.",
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
  // Compara com 2 casas, como o card mostra: sem isso, −1,2% exato saía
  // −1,1999…% e caía no nível de baixo, com o chip dizendo "−1,20%".
  const change = Math.round(todayChange * 100) / 100;
  // Dólar caindo é bom para o leitor; subindo, ruim (ver comentário no topo)
  if (change <= -t.forte) return "euforico";
  if (change >= t.forte) return "furioso";
  if (change <= -t.moderado) return "feliz";
  if (change >= t.moderado) return "irritado";
  // Movimento pequeno hoje: o mês decide entre agitado e calmo
  return volatility > t.instavelVol ? "instavel" : "estavel";
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
