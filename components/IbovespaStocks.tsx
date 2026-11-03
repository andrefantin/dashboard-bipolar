import type { IbovStock } from "@/lib/ibovespa";
import { formatBRL, formatNumber, formatPct } from "@/lib/format";
import { isGoodChange } from "@/lib/tone";
import DeltaChip from "./DeltaChip";

// Ações do Ibovespa na página do índice: as maiores altas e baixas do dia e
// quem pesa mais na carteira. Listas agrupadas do iOS, como as moedas da
// home; o separador não vai na primeira linha.

const DESTAQUES = 5;
const MAIORES_PESOS = 10;

function pesoLabel(peso: number): string {
  return `${formatNumber(peso, peso < 1 ? 2 : 1)}%`;
}

function StockRow({ stock }: { stock: IbovStock }) {
  return (
    <li className="pl-4">
      <span className="row-sep flex min-w-0 items-center gap-3 border-t border-white/[0.07] py-3 pr-4">
        <span className="min-w-0 flex-1">
          <span className="block text-headline font-semibold">{stock.ticker}</span>
          <span className="block truncate text-footnote text-ink-3">{stock.nome}</span>
        </span>
        <span className="flex flex-col items-end gap-1">
          <span className="tabular text-body leading-none">
            {stock.preco !== null ? formatBRL(stock.preco, 2) : "—"}
          </span>
          {stock.variacao !== null && <DeltaChip pct={stock.variacao} solid goodWhen="up" />}
        </span>
      </span>
    </li>
  );
}

function StockList({ id, title, stocks, empty }: { id: string; title: string; stocks: IbovStock[]; empty: string }) {
  return (
    <section aria-labelledby={id}>
      <h3 id={id} className="mb-2 text-subhead font-semibold text-ink-2">
        {title}
      </h3>
      {stocks.length > 0 ? (
        <ol className="glass overflow-hidden [&>li:first-child_.row-sep]:border-t-0">
          {stocks.map((s) => (
            <StockRow key={s.ticker} stock={s} />
          ))}
        </ol>
      ) : (
        <p className="text-subhead text-ink-3">{empty}</p>
      )}
    </section>
  );
}

export default function IbovespaStocks({ stocks }: { stocks: IbovStock[] }) {
  const cotadas = stocks.filter((s) => s.variacao !== null);
  const altas = cotadas
    .filter((s) => s.variacao! > 0)
    .sort((a, b) => b.variacao! - a.variacao!)
    .slice(0, DESTAQUES);
  const baixas = cotadas
    .filter((s) => s.variacao! < 0)
    .sort((a, b) => a.variacao! - b.variacao!)
    .slice(0, DESTAQUES);
  const sobem = cotadas.filter((s) => s.variacao! > 0).length;
  const caem = cotadas.filter((s) => s.variacao! < 0).length;
  // stocks já vem por peso
  const pesados = stocks.slice(0, MAIORES_PESOS);
  const maiorPeso = pesados[0]?.peso ?? 1;

  return (
    <div className="mt-8 space-y-8">
      {cotadas.length > 0 && (
        <section aria-labelledby="destaques">
          <h2 id="destaques" className="text-footnote font-medium uppercase tracking-wider text-ink-3">
            Destaques de hoje
          </h2>
          <p className="mb-4 mt-1 text-subhead text-ink-3">
            Entre as {stocks.length} ações do índice: {sobem} em alta, {caem} em queda.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            <StockList id="altas" title="Maiores altas" stocks={altas} empty="Nenhuma ação do índice sobe hoje." />
            <StockList id="baixas" title="Maiores baixas" stocks={baixas} empty="Nenhuma ação do índice cai hoje." />
          </div>
        </section>
      )}

      {pesados.length > 0 && (
        <section aria-labelledby="composicao">
          <h2 id="composicao" className="text-footnote font-medium uppercase tracking-wider text-ink-3">
            Quem pesa mais no índice
          </h2>
          <p className="mb-4 mt-1 text-subhead text-ink-3">
            Participação de cada ação na carteira de hoje, segundo a B3.
          </p>
          <ol className="glass overflow-hidden [&>li:first-child_.row-sep]:border-t-0">
            {pesados.map((s) => (
              <li key={s.ticker} className="pl-4">
                <span className="row-sep flex items-center gap-3 border-t border-white/[0.07] py-3 pr-4">
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className="text-headline font-semibold">{s.ticker}</span>
                      <span className="truncate text-footnote text-ink-3">{s.nome}</span>
                    </span>
                    {/* barra proporcional à maior participação */}
                    <span aria-hidden="true" className="mt-2 block h-1 rounded-full bg-white/[0.06]">
                      <span
                        className="block h-full rounded-full bg-ink-3/70"
                        style={{ width: `${(s.peso / maiorPeso) * 100}%` }}
                      />
                    </span>
                  </span>
                  <span className="tabular w-14 text-right text-body">{pesoLabel(s.peso)}</span>
                </span>
              </li>
            ))}
          </ol>

          {stocks.length > MAIORES_PESOS && (
            <details className="group mt-4">
              <summary className="inline-flex min-h-11 cursor-pointer list-none items-center text-body text-pos transition-opacity active:opacity-60 md:hover:underline [&::-webkit-details-marker]:hidden">
                <span className="group-open:hidden">Ver as {stocks.length} ações</span>
                <span className="hidden group-open:inline">Mostrar menos</span>
              </summary>
              <table className="glass mt-2 w-full overflow-hidden text-subhead">
                <caption className="sr-only">Todas as ações do Ibovespa, por participação</caption>
                <thead>
                  <tr className="text-left text-footnote text-ink-3">
                    <th scope="col" className="px-4 pb-2 pt-3 font-medium">Ação</th>
                    <th scope="col" className="px-2 pb-2 pt-3 text-right font-medium">Peso</th>
                    <th scope="col" className="px-4 pb-2 pt-3 text-right font-medium">Hoje</th>
                  </tr>
                </thead>
                <tbody className="tabular">
                  {stocks.map((s) => (
                    <tr key={s.ticker} className="border-t border-white/[0.07]">
                      <td className="px-4 py-2.5">
                        <span className="font-medium">{s.ticker}</span>{" "}
                        <span className="text-footnote text-ink-3">{s.nome}</span>
                      </td>
                      <td className="px-2 py-2.5 text-right text-ink-2">{pesoLabel(s.peso)}</td>
                      <td
                        className={`px-4 py-2.5 text-right ${
                          s.variacao === null ? "text-ink-3" : isGoodChange(s.variacao, "up") ? "text-pos" : "text-neg"
                        }`}
                      >
                        {s.variacao !== null ? formatPct(s.variacao) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          )}
        </section>
      )}
    </div>
  );
}
