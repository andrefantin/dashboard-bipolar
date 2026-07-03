import type { Metadata } from "next";
import Image from "next/image";
import Backdrop from "@/components/Backdrop";
import GlassPanel from "@/components/GlassPanel";
import { IconArrowUpRight } from "@tabler/icons-react";
import { PROFILE_URL } from "@/components/Header";

export const metadata: Metadata = {
  title: "Sobre",
  description:
    "O Dólar Bipolar é um perfil satírico de economia que divulga a cotação do dólar no Bluesky. Conheça o projeto e entenda o que move o câmbio.",
  alternates: { canonical: "/sobre" },
};

export default function SobrePage() {
  return (
    <>
      <Backdrop />
      <article className="mx-auto max-w-3xl space-y-6 py-8">
        <header className="flex items-center gap-4">
          <Image
            src="/mascote/default.webp"
            alt="Mascote do Dólar Bipolar"
            width={72}
            height={72}
            className="rounded-2xl"
          />
          <div>
            <h1 className="font-display text-2xl font-medium tracking-tight">Sobre</h1>
            <p className="text-ink-2">
              Dólar Bipolar é um perfil satírico de economia que divulga a cotação do
              dólar no Bluesky.
            </p>
          </div>
        </header>

        <GlassPanel className="space-y-4 p-6 text-ink-2">
          <p>
            A cotação do dólar em relação ao real é crucial para a economia,
            influenciada por fatores como taxas de juros, política, balança comercial,
            especulação e intervenção do Banco Central. Sua volatilidade afeta preços
            de importados, viagens e oportunidades de investimento — e o humor deste
            site.
          </p>
          <p>
            Aqui você acompanha o câmbio em tempo real, o histórico de cada moeda, as
            manchetes que explicam os solavancos e o nosso{" "}
            <strong className="text-ink">Índice de Humor do Dólar</strong>, calculado a
            partir da volatilidade dos últimos 30 dias. É estatística de verdade, com
            diagnóstico de brincadeira.
          </p>
        </GlassPanel>

        <GlassPanel className="space-y-4 p-6 text-ink-2">
          <h2 className="font-display text-lg font-medium text-ink">
            O que move a cotação do dólar
          </h2>
          <p>
            A cotação do dólar frente ao real é um aspecto fundamental do mercado
            financeiro. Ela representa o valor relativo da moeda dos Estados Unidos
            (USD) em comparação com o real brasileiro (BRL), e é determinada pelo
            mercado de câmbio, onde bancos, empresas, investidores e especuladores
            compram e vendem moedas com base na oferta e na demanda.
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-ink">Taxa de juros</strong> — quando os juros nos
              EUA estão mais altos que no Brasil, investidores buscam retornos maiores
              lá, aumentando a demanda por dólares.
            </li>
            <li>
              <strong className="text-ink">Economia e política</strong> — decisões de
              governo, eventos políticos e indicadores como PIB, desemprego e inflação
              influenciam a confiança dos investidores.
            </li>
            <li>
              <strong className="text-ink">Balança comercial</strong> — se o Brasil
              exporta mais do que importa, a demanda por reais sobe e pressiona o dólar
              para baixo.
            </li>
            <li>
              <strong className="text-ink">Especulação financeira</strong> —
              investidores compram e vendem grandes volumes com base em expectativas de
              movimentos futuros.
            </li>
            <li>
              <strong className="text-ink">Intervenção do Banco Central</strong> — o BC
              pode comprar ou vender moeda para estabilizar o câmbio quando considera
              necessário.
            </li>
          </ul>
        </GlassPanel>

        <GlassPanel id="contato" className="space-y-3 p-6 text-ink-2 scroll-mt-24">
          <h2 className="font-display text-lg font-medium text-ink">Contato</h2>
          <p>O jeito mais rápido de falar com o Dólar Bipolar é pelos perfis:</p>
          <ul className="space-y-1">
            <li>
              <a
                href={PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-pos underline-offset-2 hover:underline"
              >
                Bluesky — @dolarbipolar.com <IconArrowUpRight size={14} aria-hidden="true" className="inline align-[-2px]" />
              </a>
            </li>
            <li>
              <a
                href="https://twitter.com/dolarbipolar"
                target="_blank"
                rel="noopener noreferrer"
                className="text-pos underline-offset-2 hover:underline"
              >
                Twitter/X — @dolarbipolar <IconArrowUpRight size={14} aria-hidden="true" className="inline align-[-2px]" />
              </a>
            </li>
          </ul>
          <p className="text-sm text-ink-3">
            Cotações fornecidas pela AwesomeAPI. Cotações informativas — não é
            recomendação de investimento.
          </p>
        </GlassPanel>
      </article>
    </>
  );
}
