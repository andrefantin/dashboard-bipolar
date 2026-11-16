"use client";

import { useEffect, useState } from "react";
import { IconArrowsUpDown, IconChevronDown } from "@tabler/icons-react";
import { CURRENCIES } from "@/lib/awesomeapi";
import { formatCurrency, formatNumber, formatTime } from "@/lib/format";
import CurrencyIcon from "./CurrencyIcon";

// Conversor entre o real e as moedas do site, pela cotação comercial. Valor e
// moedas ficam na URL (?de=usd&para=brl&valor=100): dá para mandar o link, e
// as páginas de moeda abrem o conversor já na moeda delas.

interface Option {
  code: string;
  slug: string;
  nome: string;
  color: string;
}

const OPTIONS: Option[] = [
  { code: "BRL", slug: "brl", nome: "Real", color: "#d9f99d" },
  ...CURRENCIES.map((c) => ({ code: c.code, slug: c.slug, nome: c.nome, color: c.color })),
];

const QUICK_AMOUNTS = [1, 10, 100, 1000];

export interface ConverterRate {
  code: string;
  /** cotação por unidade, em BRL */
  bid: number;
  timestamp: number;
}

/** Aceita o jeito brasileiro ("1.234,56") e o americano ("1234.56"): com
 *  vírgula, ela é a decimal e os pontos são milhar; só com ponto, ele é
 *  decimal, salvo se vier seguido de exatamente três dígitos ("1.000"). */
export function parseAmount(text: string): number | null {
  const t = text.replace(/[^\d.,]/g, "");
  if (!t) return null;
  let normalized: string;
  if (t.includes(",")) normalized = t.replace(/\./g, "").replace(",", ".");
  else if ((t.match(/\./g) ?? []).length > 1 || /^\d+\.\d{3}$/.test(t)) normalized = t.replace(/\./g, "");
  else normalized = t;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

/** O valor digitado, reescrito no formato pt-BR ("1.234,5"). */
function amountText(n: number, code: string): string {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: code === "BTC" ? 8 : 2 }).format(n);
}

function CurrencySelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (code: string) => void;
}) {
  const option = OPTIONS.find((o) => o.code === value) ?? OPTIONS[0];
  return (
    // O <select> nativo fica invisível por cima da pílula: no iPhone abre a
    // roda de opções do sistema, e leitores de tela o anunciam normalmente.
    <label className="relative flex shrink-0 items-center gap-2 rounded-full bg-white/[0.06] py-1.5 pl-1.5 pr-2.5 transition-colors active:bg-white/[0.1] md:hover:bg-white/[0.09]">
      <CurrencyIcon code={option.code} color={option.color} size={30} />
      <span className="text-headline font-semibold">{option.code}</span>
      <IconChevronDown size={16} className="text-ink-3" aria-hidden="true" />
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer appearance-none opacity-0"
      >
        {OPTIONS.map((o) => (
          <option key={o.code} value={o.code}>
            {o.code} · {o.nome}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function Converter({ rates }: { rates: ConverterRate[] }) {
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("BRL");
  const [text, setText] = useState("100");

  // Estado inicial da URL, depois da hidratação (o HTML estático sai com o padrão)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = (slug: string | null) => OPTIONS.find((o) => o.slug === slug?.toLowerCase())?.code;
    const de = code(params.get("de"));
    const para = code(params.get("para"));
    const valor = parseAmount(params.get("valor") ?? "");
    if (de) setFrom(de);
    if (para) setTo(para);
    else if (de && de !== "BRL") setTo("BRL");
    if (valor !== null) setText(amountText(valor, de ?? "USD"));
  }, []);

  const amount = parseAmount(text);
  const slugOf = (c: string) => OPTIONS.find((o) => o.code === c)?.slug ?? c.toLowerCase();

  // URL acompanha o que está na tela, sem empilhar histórico
  useEffect(() => {
    const params = new URLSearchParams({ de: slugOf(from), para: slugOf(to) });
    if (amount !== null) params.set("valor", String(amount));
    history.replaceState(history.state, "", `${location.pathname}?${params}`);
  }, [from, to, amount]);

  const bid = (code: string) => (code === "BRL" ? 1 : rates.find((r) => r.code === code)?.bid ?? null);
  const convert = (value: number, a: string, b: string) => {
    const ra = bid(a);
    const rb = bid(b);
    return ra && rb ? (value * ra) / rb : null;
  };

  const result = amount !== null ? convert(amount, from, to) : null;
  const unitRate = convert(1, from, to);
  const updatedAt = rates.length ? Math.max(...rates.map((r) => r.timestamp)) : null;

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <>
      <div className="glass-raised">
        <div className="flex items-center gap-3 p-4">
          <CurrencySelect label="Converter de" value={from} onChange={setFrom} />
          <label className="min-w-0 flex-1">
            <span className="sr-only">Valor</span>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={() => amount !== null && setText(amountText(amount, from))}
              onFocus={(e) => e.target.select()}
              className="tabular w-full bg-transparent text-right font-display text-title1 font-semibold outline-none placeholder:text-ink-3"
              placeholder="0"
            />
          </label>
        </div>

        {/* Divisor com o botão de inverter no meio, como no app Conversor */}
        <div className="relative h-px bg-white/[0.07]">
          <button
            type="button"
            onClick={swap}
            aria-label="Inverter as moedas"
            className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#16221d] text-pos transition-transform active:scale-90 md:hover:bg-[#1b2a24]"
          >
            <IconArrowsUpDown size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center gap-3 p-4">
          <CurrencySelect label="Converter para" value={to} onChange={setTo} />
          <output
            aria-live="polite"
            className="tabular min-w-0 flex-1 truncate text-right font-display text-title1 font-semibold"
          >
            {result !== null ? formatCurrency(result, to, true) : "—"}
          </output>
        </div>
      </div>

      <p className="mt-3 text-subhead text-ink-3">
        {unitRate !== null ? (
          <>
            <span className="tabular">
              {formatCurrency(1, from)} = {formatCurrency(unitRate, to, true)}
            </span>
            {updatedAt && ` · cotação comercial das ${formatTime(new Date(updatedAt))}`}
          </>
        ) : (
          "Cotação indisponível para este par agora."
        )}
      </p>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Valores rápidos">
        {QUICK_AMOUNTS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setText(formatNumber(n, 0))}
            aria-pressed={amount === n}
            className={`tabular min-h-11 rounded-full px-4 text-subhead font-medium transition-colors active:opacity-60 ${
              amount === n ? "bg-pos/15 text-pos" : "bg-white/[0.06] text-ink-2 md:hover:bg-white/[0.09]"
            }`}
          >
            {formatNumber(n, 0)}
          </button>
        ))}
      </div>

      {amount !== null && amount > 0 && (
        <section aria-labelledby="outras-moedas" className="mt-8">
          <h2 id="outras-moedas" className="mb-2 text-footnote font-medium uppercase tracking-wider text-ink-3">
            {formatCurrency(amount, from)} em outras moedas
          </h2>
          <ul className="glass overflow-hidden [&>li:first-child_.row-sep]:border-t-0">
            {OPTIONS.filter((o) => o.code !== from).map((o) => {
              const value = convert(amount, from, o.code);
              return (
                <li key={o.code}>
                  {/* Tocar numa moeda a coloca como destino lá em cima */}
                  <button
                    type="button"
                    onClick={() => {
                      setTo(o.code);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="flex w-full items-center gap-3 pl-4 text-left transition-colors active:bg-white/[0.06] md:hover:bg-white/[0.04]"
                  >
                    <CurrencyIcon code={o.code} color={o.color} />
                    <span className="row-sep flex min-w-0 flex-1 items-center gap-3 border-t border-white/[0.07] py-3 pr-4">
                      <span className="min-w-0 flex-1">
                        <span className="block text-headline font-semibold">{o.code}</span>
                        <span className="block truncate text-footnote text-ink-3">{o.nome}</span>
                      </span>
                      <span className={`tabular text-body ${o.code === to ? "text-pos" : ""}`}>
                        {value !== null ? formatCurrency(value, o.code, true) : "—"}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}
