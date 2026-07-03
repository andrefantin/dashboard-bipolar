import type { Metadata } from "next";
import Link from "next/link";
import Backdrop from "@/components/Backdrop";
import GlassPanel from "@/components/GlassPanel";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Dúvidas sobre o dólar e o câmbio",
  description:
    "Qual a diferença entre dólar comercial e turismo? Por que o dólar sobe? Como a cotação afeta seu bolso? Respostas diretas para as dúvidas mais comuns sobre câmbio.",
  alternates: { canonical: "/duvidas" },
};

// Fonte única: alimenta a página e o schema FAQPage (rich results do Google)
const FAQS: { q: string; a: string }[] = [
  {
    q: "Qual é a cotação do dólar hoje?",
    a: "A cotação do dólar comercial em tempo real está na página inicial do Dólar Bipolar, atualizada a cada poucos minutos a partir dos dados da AwesomeAPI. Lá você também vê a mínima e a máxima do dia, o histórico de até 1 ano e as manchetes que explicam os movimentos.",
  },
  {
    q: "Qual a diferença entre dólar comercial e dólar turismo?",
    a: "O dólar comercial é a taxa usada em operações entre bancos, empresas e no comércio exterior — é a cotação que aparece no noticiário e neste site. O dólar turismo é o preço para pessoas físicas comprarem moeda em espécie ou carregarem cartões internacionais, e costuma ser mais caro porque embute custos logísticos, impostos e a margem das corretoras.",
  },
  {
    q: "Por que o dólar sobe e desce tanto?",
    a: "A cotação é definida pelo mercado de câmbio, onde bancos, empresas e investidores compram e vendem moeda o dia inteiro. Juros nos EUA e no Brasil, inflação, situação fiscal, eleições, crises internacionais e até uma declaração de autoridade podem mudar a percepção de risco — e o preço — em minutos. Por isso o apelido de bipolar.",
  },
  {
    q: "O que faz o dólar subir?",
    a: "Em geral, o dólar sobe frente ao real quando investidores buscam segurança fora do Brasil: juros mais altos nos EUA, incerteza fiscal ou política no Brasil, queda no preço das commodities que exportamos ou crises globais. Menos dólares entrando e mais saindo significa dólar mais caro.",
  },
  {
    q: "Como a cotação do dólar afeta meu dia a dia?",
    a: "Mesmo quem nunca viajou sente o câmbio: combustível, trigo, eletrônicos, remédios e componentes importados ficam mais caros com o dólar alto, pressionando a inflação. Viagens internacionais, assinaturas cobradas em dólar e compras em sites estrangeiros também variam junto com a cotação.",
  },
  {
    q: "O que é o Índice de Humor do Dólar?",
    a: "É a assinatura do Dólar Bipolar: um termômetro satírico calculado com estatística de verdade. Medimos a volatilidade dos últimos 30 dias (desvio-padrão das variações diárias) e a variação de hoje, e traduzimos o resultado em cinco humores — de 'Em surto de alta' a 'Caindo e chorando'. É diagnóstico de brincadeira sobre dados reais.",
  },
  {
    q: "De onde vêm os dados deste site?",
    a: "As cotações vêm da AwesomeAPI, atualizadas ao longo de todo o pregão, e o histórico diário cobre até 1 ano por moeda. As manchetes vêm do Google Notícias, sempre com crédito e link para o veículo original. Nada de dado inventado — só a interpretação é que é bipolar.",
  },
  {
    q: "O dólar vai subir ou cair?",
    a: "Ninguém sabe — nem o mercado, nem os economistas, nem este site (e desconfie de quem garantir o contrário). O que oferecemos é o retrato fiel do presente e do passado recente para você decidir melhor. Cotações informativas: não é recomendação de investimento.",
  },
];

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

export default function DuvidasPage() {
  return (
    <>
      <Backdrop />
      <JsonLd data={FAQ_SCHEMA} />
      <article className="mx-auto max-w-3xl py-8">
        <header>
          <p className="text-xs font-medium uppercase tracking-widest text-ink-3">
            Perguntas frequentes
          </p>
          <h1 className="mt-1 font-display text-2xl font-medium tracking-tight sm:text-3xl">
            Dúvidas sobre o dólar e o câmbio
          </h1>
          <p className="mt-2 text-sm text-ink-2">
            Respostas diretas, sem economês — e com a dose regulamentar de ironia.
          </p>
        </header>

        <div className="mt-8 space-y-8">
          {FAQS.map(({ q, a }) => (
            <section key={q}>
              <h2 className="font-display text-lg font-medium">{q}</h2>
              <p className="mt-2 leading-relaxed text-ink-2">{a}</p>
            </section>
          ))}
        </div>

        <GlassPanel className="mt-10 flex flex-wrap items-center justify-between gap-3 p-5">
          <p className="text-sm text-ink-2">
            Ficou faltando alguma? A cotação ao vivo responde boa parte delas.
          </p>
          <Link
            href="/"
            className="rounded-full bg-pos/15 px-4 py-2 text-sm font-medium text-pos transition-colors hover:bg-pos/25"
          >
            Ver o dólar agora
          </Link>
        </GlassPanel>
      </article>
    </>
  );
}
