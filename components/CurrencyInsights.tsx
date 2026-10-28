import { CURRENCIES, type CurrencyMeta, type DailyPoint, type Rate } from "@/lib/awesomeapi";
import { formatBRL, formatPct } from "@/lib/format";
import CurrencyIcon from "./CurrencyIcon";
import TransitionLink from "./TransitionLink";

// Conteúdo em texto da página da moeda, renderizado no servidor para o
// Google ler: resumo do dia, tabelas de conversão (buscas como "quanto é 100
// euros em reais") e links para as outras moedas.

/** Quantidade de referência no texto, com concordância ("1 euro vale",
 *  "100 ienes valem"). Moedas cotadas em lote usam o lote. */
const UNIDADE: Record<string, { texto: string; plural: boolean }> = {
  ARS: { texto: "100 pesos argentinos", plural: true },
  JPY: { texto: "100 ienes", plural: true },
  KRW: { texto: "1.000 wons", plural: true },
};

function unidade(meta: CurrencyMeta) {
  return UNIDADE[meta.code] ?? { texto: `1 ${meta.nome.toLowerCase()}`, plural: false };
}

/** Valores da moeda estrangeira no formato pt-BR (€ 100,00, JP¥ 1.000).
 *  BTC não é ISO 4217, mas o Intl aceita o código e mostra "BTC 0,001". */
function formatForeign(amount: number, code: string): string {
  const opts = code === "BTC" ? { minimumFractionDigits: 2, maximumFractionDigits: 8 } : {};
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: code, ...opts }).format(amount);
}

/** Quantias da tabela "moeda → real": múltiplos do lote; frações no bitcoin. */
function foreignAmounts(meta: CurrencyMeta): number[] {
  if (meta.code === "BTC") return [0.001, 0.01, 0.1, 0.5, 1];
  return [1, 5, 10, 50, 100, 1000].map((n) => n * meta.lote);
}

const REAL_AMOUNTS = [1, 10, 50, 100, 500, 1000];

function ConversionTable({
  caption,
  heading,
  rows,
}: {
  caption: string;
  heading: [string, string];
  rows: [string, string][];
}) {
  return (
    <table className="glass w-full overflow-hidden text-subhead">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="text-left text-footnote text-ink-3">
          <th scope="col" className="px-4 pb-2 pt-3 font-medium">{heading[0]}</th>
          <th scope="col" className="px-4 pb-2 pt-3 text-right font-medium">{heading[1]}</th>
        </tr>
      </thead>
      <tbody className="tabular">
        {rows.map(([from, to]) => (
          <tr key={from} className="border-t border-white/[0.07]">
            <td className="px-4 py-2.5 text-ink-2">{from}</td>
            <td className="px-4 py-2.5 text-right">{to}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function CurrencyInsights({
  meta,
  rate,
  series,
}: {
  meta: CurrencyMeta;
  rate?: Rate;
  series: DailyPoint[];
}) {
  const nome = meta.nome.toLowerCase();
  const others = CURRENCIES.filter((c) => c.code !== meta.code);
  const u = unidade(meta);

  let summary: string | null = null;
  if (rate) {
    const up = rate.pctChange >= 0;
    summary =
      `Hoje, ${u.texto} ${u.plural ? "valem" : "vale"} ${formatBRL(rate.bid * meta.lote, meta.decimals)} — ` +
      `${up ? "alta" : "queda"} de ${formatPct(Math.abs(rate.pctChange)).replace("+", "")} em relação ao fechamento anterior. ` +
      `A mínima do dia foi ${formatBRL(rate.low * meta.lote, meta.decimals)} e a máxima, ${formatBRL(rate.high * meta.lote, meta.decimals)}.`;
    if (series.length > 1) {
      const first = series[0].bid * meta.lote;
      const last = series[series.length - 1].bid * meta.lote;
      const change = ((last - first) / first) * 100;
      summary +=
        ` Nos últimos 30 dias, ${meta.artigo} ${nome} ${change >= 0 ? "subiu" : "caiu"} ` +
        `${formatPct(Math.abs(change)).replace("+", "")}, de ${formatBRL(first, meta.decimals)} para ${formatBRL(last, meta.decimals)}.`;
    }
  }

  return (
    <div className="mt-8 space-y-8">
      {summary && (
        <section aria-labelledby="resumo">
          <h2 id="resumo" className="mb-2 text-footnote font-medium uppercase tracking-wider text-ink-3">
            Resumo de hoje
          </h2>
          <p className="text-body leading-relaxed text-ink-2">{summary}</p>
        </section>
      )}

      {rate && (
        <section aria-labelledby="converter">
          <h2 id="converter" className="mb-2 text-footnote font-medium uppercase tracking-wider text-ink-3">
            Quanto vale {meta.artigo} {nome} em reais
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <ConversionTable
              caption={`Conversão de ${nome} para real`}
              heading={[meta.nome, "Real"]}
              rows={foreignAmounts(meta).map((n) => [formatForeign(n, meta.code), formatBRL(n * rate.bid, 2)])}
            />
            <ConversionTable
              caption={`Conversão de real para ${nome}`}
              heading={["Real", meta.nome]}
              rows={REAL_AMOUNTS.map((n) => [formatBRL(n, 2), formatForeign(n / rate.bid, meta.code)])}
            />
          </div>
          <p className="mt-2 text-footnote text-ink-3">
            Pela cotação comercial do momento. Casas de câmbio e cartões cobram spread e IOF à parte.
          </p>
        </section>
      )}

      <section aria-labelledby="outras">
        <h2 id="outras" className="mb-2 text-footnote font-medium uppercase tracking-wider text-ink-3">
          Outras moedas
        </h2>
        <ul className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {others.map((c) => (
            <li key={c.code}>
              <TransitionLink
                nav="push"
                href={`/moeda/${c.slug}`}
                className="glass flex items-center gap-2.5 px-3 py-2.5 transition-colors active:opacity-70 md:hover:bg-white/[0.07]"
              >
                <CurrencyIcon code={c.code} color={c.color} size={28} />
                <span className="min-w-0">
                  <span className="block text-subhead font-medium">{c.code}</span>
                  <span className="block truncate text-footnote text-ink-3">{c.nome}</span>
                </span>
              </TransitionLink>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
