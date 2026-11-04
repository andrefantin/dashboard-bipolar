import type { DailyPoint } from "./awesomeapi";
import { dayKey, TIMEZONE } from "./format";

// Ibovespa sem custo e sem chave, de duas fontes públicas:
// - B3: a carteira teórica do dia (ações, peso, quantidade teórica e o
//   redutor) e os fechamentos oficiais, dia a dia, de cada ano;
// - brapi.dev: a lista de cotações de todas as ações da bolsa, numa
//   requisição só (não pede token).
// O índice é, por definição, Σ(preço × quantidade teórica) ÷ redutor; com os
// preços da brapi, a conta reproduz o número da B3 a menos do atraso das
// cotações. Com BRAPI_TOKEN, a pontuação oficial (^BVSP) tem preferência.

const B3_PORTFOLIO = "https://sistemaswebb3-listados.b3.com.br/indexProxy/indexCall/GetPortfolioDay";
const B3_STATISTICS = "https://sistemaswebb3-listados.b3.com.br/indexStatisticsProxy/IndexCall/GetPortfolioDay";

// Mesmo ritmo das cotações; carteira e fechamentos mudam no máximo uma vez por dia
const REVALIDATE_QUOTES = 300;
const REVALIDATE_B3 = 21600;

export interface BovespaQuote {
  points: number;
  pctChange: number;
  timestamp: number;
  /** true quando a pontuação foi calculada com as cotações das ações */
  estimated: boolean;
}

export interface IbovStock {
  ticker: string;
  nome: string;
  /** participação no índice, em % */
  peso: number;
  /** null quando a brapi não trouxe a ação */
  preco: number | null;
  /** variação do dia, em % */
  variacao: number | null;
}

export interface IbovespaSnapshot {
  quote: BovespaQuote | null;
  /** todas as ações da carteira, por peso (maior primeiro) */
  stocks: IbovStock[];
}

/** A B3 manda números no formato pt-BR, como texto ("13.998.953,64"). */
function parseBR(value: string | null | undefined): number | null {
  if (!value) return null;
  const n = Number(value.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** As APIs da B3 recebem os parâmetros como JSON em base64 no caminho. */
function b3Url(base: string, params: Record<string, string | number>): string {
  return `${base}/${Buffer.from(JSON.stringify(params)).toString("base64")}`;
}

/** Nomes de exibição pela raiz do ticker (PETR3 e PETR4 → Petrobras). A B3
 *  manda abreviações em caixa alta ("ITAUUNIBANCO", "SID NACIONAL"); quem
 *  entrar na carteira e não estiver aqui ganha o nome da B3 em caixa normal. */
const NOMES: Record<string, string> = {
  ABEV: "Ambev", ALOS: "Allos", ASAI: "Assaí", AURE: "Auren", AXIA: "Axia Energia",
  AZZA: "Azzas 2154", B3SA: "B3", BBAS: "Banco do Brasil", BBDC: "Bradesco",
  BBSE: "BB Seguridade", BEEF: "Minerva", BPAC: "BTG Pactual", BRAP: "Bradespar",
  BRAV: "Brava", CEAB: "C&A", CMIG: "Cemig", CMIN: "CSN Mineração", COGN: "Cogna",
  CPFE: "CPFL Energia", CPLE: "Copel", CSAN: "Cosan", CSMG: "Copasa", CSNA: "CSN",
  CURY: "Cury", CXSE: "Caixa Seguridade", CYRE: "Cyrela", DIRR: "Direcional",
  EGIE: "Engie Brasil", EMBJ: "Embraer", ENEV: "Eneva", ENGI: "Energisa",
  EQTL: "Equatorial", FLRY: "Fleury", GGBR: "Gerdau", GOAU: "Metalúrgica Gerdau",
  HAPV: "Hapvida", HYPE: "Hypera", IGTI: "Iguatemi", ISAE: "ISA Energia",
  ITSA: "Itaúsa", ITUB: "Itaú Unibanco", KLBN: "Klabin", LREN: "Lojas Renner",
  MBRF: "MBRF", MGLU: "Magazine Luiza", MOTV: "Motiva", MRVE: "MRV",
  MULT: "Multiplan", NATU: "Natura", PETR: "Petrobras", POMO: "Marcopolo",
  PRIO: "PRIO", PSSA: "Porto Seguro", RADL: "Raia Drogasil", RAIL: "Rumo",
  RDOR: "Rede D'Or", RENT: "Localiza", SANB: "Santander Brasil", SBSP: "Sabesp",
  SMFT: "Smart Fit", SUZB: "Suzano", TAEE: "Taesa", TEND: "Tenda", TIMS: "TIM",
  TOTS: "Totvs", UGPA: "Ultrapar", USIM: "Usiminas", VALE: "Vale", VAMO: "Vamos",
  VBBR: "Vibra", VIVA: "Vivara", VIVT: "Vivo", WEGE: "WEG", YDUQ: "Yduqs",
};

function displayName(ticker: string, b3Name: string): string {
  const known = NOMES[ticker.slice(0, 4)];
  if (known) return known;
  return b3Name
    .replace(/\s+(S\.?A\.?|S\/A|ON|PN)$/i, "")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

interface Member {
  ticker: string;
  nome: string;
  peso: number;
  qtd: number;
}

interface Portfolio {
  members: Member[];
  redutor: number;
}

async function fetchPortfolio(): Promise<Portfolio | null> {
  const res = await fetch(
    b3Url(B3_PORTFOLIO, { language: "pt-br", pageNumber: 1, pageSize: 200, index: "IBOV", segment: "1" }),
    { next: { revalidate: REVALIDATE_B3 }, signal: AbortSignal.timeout(8000) }
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    header?: { reductor?: string };
    results?: { cod: string; asset: string; part: string; theoricalQty: string }[];
  };
  const redutor = parseBR(data.header?.reductor);
  const members: Member[] = [];
  for (const r of data.results ?? []) {
    const peso = parseBR(r.part);
    const qtd = parseBR(r.theoricalQty);
    if (!r.cod || peso === null || qtd === null) continue;
    members.push({ ticker: r.cod.trim(), nome: displayName(r.cod.trim(), r.asset.trim()), peso, qtd });
  }
  if (!redutor || members.length === 0) return null;
  return { members: members.sort((a, b) => b.peso - a.peso), redutor };
}

interface ListedStock {
  close: number;
  change: number;
}

/** Preço e variação do dia de todas as ações listadas, por ticker. */
async function fetchStockPrices(): Promise<Map<string, ListedStock>> {
  const token = process.env.BRAPI_TOKEN;
  const res = await fetch("https://brapi.dev/api/quote/list?type=stock&limit=2000", {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    next: { revalidate: REVALIDATE_QUOTES },
    signal: AbortSignal.timeout(8000),
  });
  const prices = new Map<string, ListedStock>();
  if (!res.ok) return prices;
  const data = (await res.json()) as { stocks?: { stock: string; close: number | null; change: number | null }[] };
  for (const s of data.stocks ?? []) {
    if (typeof s.close === "number" && s.close > 0) prices.set(s.stock, { close: s.close, change: s.change ?? 0 });
  }
  return prices;
}

/** A pontuação oficial (^BVSP) — só com BRAPI_TOKEN. */
async function fetchOfficialQuote(): Promise<BovespaQuote | null> {
  const token = process.env.BRAPI_TOKEN;
  if (!token) return null;
  // Token no header (recomendação da própria brapi), fora da URL e dos logs.
  const res = await fetch("https://brapi.dev/api/quote/%5EBVSP", {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: REVALIDATE_QUOTES },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    results?: { regularMarketPrice?: number; regularMarketChangePercent?: number; regularMarketTime?: string }[];
  };
  const q = data.results?.[0];
  if (!q || typeof q.regularMarketPrice !== "number") return null;
  return {
    points: q.regularMarketPrice,
    pctChange: q.regularMarketChangePercent ?? 0,
    timestamp: q.regularMarketTime ? new Date(q.regularMarketTime).getTime() : Date.now(),
    estimated: false,
  };
}

/** Peso máximo (em % do índice) das ações sem cotação para ainda calcular.
 *  A brapi às vezes deixa uma ação de fora da lista por alguns minutos; sem
 *  tolerância, a pontuação sumia do site (e a linha da home junto). */
const MAX_PESO_SEM_COTACAO = 3;

/** Σ(preço × quantidade teórica) ÷ redutor, agora e no fechamento anterior
 *  (preço ÷ (1 + variação)). Ação sem cotação conta como estável no dia: o
 *  peso da B3 é calculado no fechamento anterior, então ele dá o valor dela
 *  ontem. Até 3% do índice sem cotação, o erro fica em ~0,2% no pior caso
 *  (testado tirando cada ação); acima disso, melhor não mostrar. */
function computeQuote(portfolio: Portfolio, prices: Map<string, ListedStock>): BovespaQuote | null {
  let now = 0;
  let prev = 0;
  let pesoSemCotacao = 0;
  for (const m of portfolio.members) {
    const p = prices.get(m.ticker);
    if (!p) {
      pesoSemCotacao += m.peso;
      continue;
    }
    now += p.close * m.qtd;
    prev += (p.close / (1 + p.change / 100)) * m.qtd;
  }
  if (prev <= 0 || pesoSemCotacao > MAX_PESO_SEM_COTACAO) return null;
  // valor de ontem das que faltam, mantido hoje
  const semCotacao = (prev / (1 - pesoSemCotacao / 100)) * (pesoSemCotacao / 100);
  return {
    points: (now + semCotacao) / portfolio.redutor,
    pctChange: ((now + semCotacao) / (prev + semCotacao) - 1) * 100,
    timestamp: Date.now(),
    estimated: true,
  };
}

/** Pontuação do dia + a carteira com preço e variação de cada ação. Nunca
 *  lança: o que faltar volta vazio e a página omite a parte. */
export async function fetchIbovespa(): Promise<IbovespaSnapshot> {
  const [portfolioRes, pricesRes, officialRes] = await Promise.allSettled([
    fetchPortfolio(),
    fetchStockPrices(),
    fetchOfficialQuote(),
  ]);
  const portfolio = portfolioRes.status === "fulfilled" ? portfolioRes.value : null;
  const prices = pricesRes.status === "fulfilled" ? pricesRes.value : new Map<string, ListedStock>();
  const official = officialRes.status === "fulfilled" ? officialRes.value : null;

  const stocks: IbovStock[] = (portfolio?.members ?? []).map((m) => {
    const p = prices.get(m.ticker);
    return { ticker: m.ticker, nome: m.nome, peso: m.peso, preco: p?.close ?? null, variacao: p?.change ?? null };
  });
  return {
    quote: official ?? (portfolio ? computeQuote(portfolio, prices) : null),
    stocks,
  };
}

/** Só a pontuação (linha da home e /api/bovespa). */
export async function fetchBovespa(): Promise<BovespaQuote | null> {
  return (await fetchIbovespa()).quote;
}

/** Fechamentos oficiais de um ano: a B3 manda uma tabela dia × mês. */
async function fetchYearCloses(year: number): Promise<{ date: string; points: number }[]> {
  const res = await fetch(b3Url(B3_STATISTICS, { index: "IBOV", language: "pt-br", year: String(year) }), {
    next: { revalidate: REVALIDATE_B3 },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`B3 ${res.status}`);
  const data = (await res.json()) as { results?: ({ day: number } & Record<string, string | number | null>)[] };
  const closes: { date: string; points: number }[] = [];
  for (const row of data.results ?? []) {
    for (let month = 1; month <= 12; month++) {
      const points = parseBR(row[`rateValue${month}`] as string | null);
      if (points === null) continue;
      const date = `${year}-${String(month).padStart(2, "0")}-${String(row.day).padStart(2, "0")}`;
      closes.push({ date, points });
    }
  }
  return closes;
}

/** Fechamentos dos últimos `days` dias corridos, no formato do gráfico das
 *  moedas (bid = pontos). Lança se a B3 não responder. */
export async function fetchIbovespaHistory(days: number, now: Date = new Date()): Promise<DailyPoint[]> {
  const cutoff = dayKey(new Date(now.getTime() - days * 86_400_000));
  const year = Number(dayKey(now).slice(0, 4));
  // O ano anterior entra quando o período começa nele, e também para dar a
  // variação do primeiro pregão do ano
  const years = Number(cutoff.slice(0, 4)) < year || cutoff.slice(5) < "01-15" ? [year - 1, year] : [year];
  const closes = (await Promise.all(years.map(fetchYearCloses))).flat().sort((a, b) => a.date.localeCompare(b.date));

  const series: DailyPoint[] = [];
  for (let i = 0; i < closes.length; i++) {
    const { date, points } = closes[i];
    if (date < cutoff) continue;
    const prev = closes[i - 1]?.points;
    series.push({
      date,
      // fim do pregão, em Brasília: o tooltip formata a data por este instante
      timestamp: new Date(`${date}T18:00:00-03:00`).getTime(),
      bid: points,
      pctChange: prev ? (points / prev - 1) * 100 : 0,
    });
  }
  return series;
}

/** Junta a pontuação de agora ao histórico, que só tem pregões encerrados
 *  (equivalente ao withLiveToday das moedas). A calculada leva a hora do
 *  cálculo, não a do último negócio: no fim de semana ela repetiria a sexta
 *  num sábado, então fica de fora. */
export function withLiveIbovespa(series: DailyPoint[], quote: BovespaQuote | null): DailyPoint[] {
  if (!quote) return series;
  const at = new Date(quote.timestamp);
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: TIMEZONE }).format(at);
  if (weekday === "Sat" || weekday === "Sun") return series;
  const today = dayKey(at);
  return [
    ...series.filter((p) => p.date !== today),
    { date: today, timestamp: quote.timestamp, bid: quote.points, pctChange: quote.pctChange },
  ];
}
