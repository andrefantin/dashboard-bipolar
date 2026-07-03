import type { Metadata } from "next";
import Backdrop from "@/components/Backdrop";
import CompareClient from "@/components/CompareClient";

export const metadata: Metadata = {
  title: "Comparar moedas",
  description:
    "Compare o desempenho do dólar, euro e outras moedas frente ao real, normalizado em base 100, de 7 dias a 1 ano.",
  alternates: { canonical: "/comparar" },
};

export default function CompararPage() {
  return (
    <>
      <Backdrop />
      <section className="py-8">
        <h1 className="font-display text-2xl font-medium tracking-tight sm:text-3xl">
          Comparação de moedas
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
