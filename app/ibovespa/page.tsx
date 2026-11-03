import type { Metadata } from "next";
import TransitionLink from "@/components/TransitionLink";
import { IconChevronLeft } from "@tabler/icons-react";
import { fetchIbovespa, fetchIbovespaHistory, withLiveIbovespa, type IbovStock } from "@/lib/ibovespa";
import { pageMetadata } from "@/lib/seo";
import { formatNumber, formatPct, formatTime } from "@/lib/format";
import { SITE_URL } from "@/lib/site";
import Backdrop from "@/components/Backdrop";
import CurrencyIcon from "@/components/CurrencyIcon";
import DeltaChip from "@/components/DeltaChip";
import GlassPanel from "@/components/GlassPanel";
import HistoryPanel from "@/components/HistoryPanel";
import IbovespaStocks from "@/components/IbovespaStocks";
import JsonLd from "@/components/JsonLd";
import RefreshButton from "@/components/RefreshButton";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  // Descrição com a pontuação corrente — regenera junto com a página (ISR 5 min)
  let live = "";
  try {
    const { quote } = await fetchIbovespa();
    if (quote) live = `Ibovespa agora: ${formatNumber(quote.points, 0)} pontos (${formatPct(quote.pctChange)}). `;
  } catch {
    // sem pontuação ao vivo, a descrição estática continua válida
  }
  return pageMetadata({
    title: "Ibovespa hoje: pontuação, maiores altas e baixas",
    description: `${live}Veja o Índice Bovespa em tempo real, as ações que mais sobem e caem no dia, o peso de cada empresa e o histórico de até 1 ano.`,
    path: "/ibovespa",
  });
}

/** As empresas que mais pesam, somando as classes de ação (PETR3 + PETR4). */
function topCompanies(stocks: IbovStock[], n: number) {
  const byName = new Map<string, number>();
  for (const s of stocks) byName.set(s.nome, (byName.get(s.nome) ?? 0) + s.peso);
  return [...byName.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

function listaPt(items: string[]): string {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`;
}

export default async function IbovespaPage() {
  const [snapshotRes, historyRes] = await Promise.allSettled([fetchIbovespa(), fetchIbovespaHistory(30)]);
  const { quote, stocks } = snapshotRes.status === "fulfilled" ? snapshotRes.value : { quote: null, stocks: [] };
  const series = withLiveIbovespa(historyRes.status === "fulfilled" ? historyRes.value : [], quote);

  const top3 = topCompanies(stocks, 3);
  const top3Peso = top3.reduce((acc, [, peso]) => acc + peso, 0);

  return (
    <>
      <Backdrop />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Ibovespa", item: `${SITE_URL}/ibovespa` },
          ],
        }}
      />

      {/* Botão "voltar" do iOS, como nas páginas de moeda */}
      <nav className="flex items-center justify-between pt-2 md:pt-6" aria-label="Voltar">
        <TransitionLink
          nav="pop"
          returnTo="ibovespa"
          href="/"
          className="-ml-2 inline-flex min-h-11 items-center gap-0.5 px-1 text-body text-pos transition-opacity active:opacity-60 md:text-sm md:hover:underline"
        >
          <IconChevronLeft size={24} stroke={2.2} aria-hidden="true" className="md:h-4 md:w-4" />
          Cotações
        </TransitionLink>
        <RefreshButton />
      </nav>

      <section className="pb-6 pt-2 md:pt-4">
        <div className="flex items-center gap-3">
          <CurrencyIcon code="IBOV" color="#d6dee2" size={44} />
          <div className="min-w-0">
            <h1 data-large-title="Ibovespa" className="font-display text-title2 font-semibold tracking-tight">
              Ibovespa
            </h1>
            <p className="text-footnote text-ink-3">Índice Bovespa · B3 · pontos</p>
          </div>
        </div>
        {quote ? (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="tabular font-display text-[40px] font-semibold leading-none md:text-5xl">
                {formatNumber(quote.points, 0)}
                <span className="ml-1.5 font-body text-title3 font-medium text-ink-3">pts</span>
              </span>
              <DeltaChip pct={quote.pctChange} large goodWhen="up" />
            </div>
            <p className="mt-3 text-subhead text-ink-3">
              {quote.estimated
                ? `Calculado às ${formatTime(new Date(quote.timestamp))} com as cotações das ações`
                : `Atualizado às ${formatTime(new Date(quote.timestamp))}`}
            </p>
          </>
        ) : (
          <p className="mt-4 text-ink-2">Pontuação indisponível agora — o histórico abaixo continua de pé.</p>
        )}
      </section>

      {series.length > 1 ? (
        <HistoryPanel
          historyPath="/api/ibovespa/history"
          initialSeries={series}
          initialDays={30}
          decimals={0}
          unit="pontos"
          goodWhen="up"
        />
      ) : (
        <GlassPanel className="p-6">
          <p className="text-ink-2">O histórico recusou-se a responder. Tente atualizar em instantes.</p>
        </GlassPanel>
      )}

      <IbovespaStocks stocks={stocks} />

      <section aria-labelledby="sobre-ibovespa" className="mt-10 space-y-6">
        <h2 id="sobre-ibovespa" className="text-footnote font-medium uppercase tracking-wider text-ink-3">
          Sobre o Ibovespa
        </h2>
        <div>
          <h3 className="text-headline font-semibold">O que é</h3>
          <p className="mt-1 text-body leading-relaxed text-ink-2">
            O Ibovespa é o principal índice da bolsa brasileira, a B3. Ele acompanha uma carteira teórica com as
            ações mais negociadas do país{stocks.length > 0 && ` — hoje são ${stocks.length}`} — e é o termômetro
            do mercado: quando o noticiário diz que &ldquo;a bolsa subiu&rdquo;, é dele que está falando. Começou
            em 100 pontos, em 2 de janeiro de 1968, e passou por ajustes de escala nos anos de inflação alta.
          </p>
        </div>
        <div>
          <h3 className="text-headline font-semibold">Como é calculado</h3>
          <p className="mt-1 text-body leading-relaxed text-ink-2">
            Cada ação entra na carteira com uma quantidade teórica, proporcional ao valor das ações que estão em
            circulação no mercado. A pontuação é a soma de preço × quantidade de todas elas, dividida por um
            redutor que a B3 ajusta para que trocas na carteira e eventos como dividendos não mexam no índice
            sozinhos. Nenhuma empresa pode passar de 20% do total
            {top3.length === 3 &&
              `, mas as maiores pesam bastante: ${listaPt(top3.map(([nome]) => nome))} somam ${formatNumber(top3Peso, 1)}% do índice`}
            .
          </p>
        </div>
        <div>
          <h3 className="text-headline font-semibold">Quem entra na carteira</h3>
          <p className="mt-1 text-body leading-relaxed text-ink-2">
            A carteira é revista a cada quatro meses, em janeiro, maio e setembro. Para entrar, a ação precisa
            estar entre as mais negociadas da bolsa (as que, juntas, somam 85% do índice de negociabilidade da
            B3), ter sido negociada em pelo menos 95% dos pregões do período e não ser uma &ldquo;penny
            stock&rdquo;, cotada abaixo de R$ 1.
          </p>
        </div>
        <div>
          <h3 className="text-headline font-semibold">O Ibovespa e o dólar</h3>
          <p className="mt-1 text-body leading-relaxed text-ink-2">
            Os dois costumam andar em sentidos opostos. Quando o investidor estrangeiro se anima com o Brasil, ele
            traz dólares para comprar ações daqui: o real se fortalece e a bolsa sobe. Quando bate o medo, vale o
            contrário — e o mascote fica furioso em dobro. Não é lei, mas acontece bastante. Por isso, aqui no
            site, verde no Ibovespa é alta, ao contrário das moedas, em que verde é o real ganhando força.
          </p>
        </div>
        <p className="text-footnote leading-relaxed text-ink-3">
          Fontes: B3 (carteira teórica e fechamentos oficiais) e brapi.dev (cotações das ações, com atraso).
          {quote?.estimated &&
            " A pontuação de hoje é calculada aqui com essas cotações, pela mesma conta da B3, e pode diferir alguns pontos do número oficial."}{" "}
          Não é recomendação de investimento.
        </p>
      </section>
    </>
  );
}
