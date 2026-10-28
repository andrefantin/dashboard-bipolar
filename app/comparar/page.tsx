import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Backdrop from "@/components/Backdrop";
import CompareClient from "@/components/CompareClient";

export const metadata: Metadata = pageMetadata({
  title: "Comparar moedas",
  description:
    "Compare o desempenho do dólar, euro e outras moedas frente ao real, normalizado em base 100, de 7 dias a 1 ano.",
  path: "/comparar",
  shareImage: true,
});

export default function CompararPage() {
  return (
    <>
      <Backdrop />
      <section className="pb-6 pt-5 md:pt-8">
        <h1
          data-large-title="Comparar"
          className="font-display text-large-title font-semibold tracking-tight"
        >
          Comparar moedas
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-2">
          Todas as moedas começam o período valendo 100. O que sobe, subiu de
          verdade — o que desce, desceu. Sem truque de escala.
        </p>
      </section>
      <CompareClient />
    </>
  );
}
