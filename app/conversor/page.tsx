import type { Metadata } from "next";
import { fetchLatestRates } from "@/lib/awesomeapi";
import { pageMetadata } from "@/lib/seo";
import Backdrop from "@/components/Backdrop";
import Converter, { type ConverterRate } from "@/components/Converter";
import RefreshButton from "@/components/RefreshButton";

export const revalidate = 300; // mesmo ritmo das cotações

export const metadata: Metadata = pageMetadata({
  title: "Conversor de moedas: real, dólar, euro e mais",
  description:
    "Converta reais em dólar, euro, libra, bitcoin e outras moedas pela cotação comercial do momento — e de volta. Rápido, sem cadastro e sem anúncio.",
  path: "/conversor",
  shareImage: true,
});

export default async function ConversorPage() {
  let rates: ConverterRate[] = [];
  try {
    rates = (await fetchLatestRates()).map(({ code, bid, timestamp }) => ({ code, bid, timestamp }));
  } catch {
    // sem cotações, o conversor mostra "indisponível" no lugar dos valores
  }

  return (
    <>
      <Backdrop />
      <section className="pb-6 pt-5 md:pt-8">
        <div className="flex items-start justify-between gap-4">
          <h1
            data-large-title="Converter"
            className="font-display text-large-title font-semibold tracking-tight"
          >
            Conversor de moedas
          </h1>
          <RefreshButton />
        </div>
        <p className="mt-1 max-w-2xl text-sm text-ink-2">
          Real, dólar, euro e companhia, pela cotação do momento. Só não converte o humor do dólar.
        </p>
      </section>

      <div className="max-w-xl">
        <Converter rates={rates} />
      </div>

      <section aria-labelledby="como-funciona" className="mt-10 max-w-2xl space-y-2">
        <h2 id="como-funciona" className="text-footnote font-medium uppercase tracking-wider text-ink-3">
          Como funciona
        </h2>
        <p className="text-body leading-relaxed text-ink-2">
          O conversor usa a cotação comercial de cada moeda em reais, a mesma das outras páginas do site,
          atualizada a cada poucos minutos. Entre duas moedas estrangeiras, a conta passa pelo real: euro para
          dólar é o euro em reais dividido pelo dólar em reais.
        </p>
        <p className="text-body leading-relaxed text-ink-2">
          É a cotação de referência do mercado, não o preço do balcão: casas de câmbio, bancos e cartões
          internacionais cobram spread e IOF por cima, então o valor final de uma compra de moeda ou de uma
          fatura em dólar costuma ser maior.
        </p>
      </section>
    </>
  );
}
