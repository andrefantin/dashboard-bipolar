"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconArrowsDiff,
  IconChartLine,
  IconHelpCircle,
  IconInfoCircle,
  type Icon,
} from "@tabler/icons-react";

interface Tab {
  href: string;
  label: string;
  icon: Icon;
  /** a aba fica ativa também nas páginas "dentro" dela (ex.: /moeda/* em Cotações) */
  match: (pathname: string) => boolean;
}

const TABS: Tab[] = [
  {
    href: "/",
    label: "Cotações",
    icon: IconChartLine,
    match: (p) => p === "/" || p.startsWith("/moeda"),
  },
  { href: "/comparar", label: "Comparar", icon: IconArrowsDiff, match: (p) => p.startsWith("/comparar") },
  { href: "/duvidas", label: "Dúvidas", icon: IconHelpCircle, match: (p) => p.startsWith("/duvidas") },
  { href: "/sobre", label: "Sobre", icon: IconInfoCircle, match: (p) => p.startsWith("/sobre") },
];

/** Barra de abas flutuante (iOS), só no celular — no desktop a navegação
 *  continua no cabeçalho. Fica acima da área segura do iPhone. */
export default function TabBar() {
  const pathname = usePathname();

  return (
    <>
    {/* Desfoque progressivo por trás da barra (ver .scroll-edge-bottom).
        Decorativo e transparente a toques. Fica abaixo da barra (z-30) e
        acima do conteúdo. */}
    <div
      aria-hidden="true"
      className="scroll-edge-bottom pointer-events-none fixed inset-x-0 bottom-0 z-[25] md:hidden"
    >
      <div className="blur-1" />
      <div className="blur-2" />
      <div className="blur-3" />
      <div className="blur-4" />
      <div className="blur-5" />
      <div className="tint" />
    </div>
    {/* A faixa inteira ignora toques; só a cápsula os recebe, então o que
        aparece dos lados dela continua clicável. */}
    <nav
      aria-label="Navegação principal"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+10px)] md:hidden"
    >
      <ul className="tabbar pointer-events-auto grid w-full max-w-[22rem] select-none grid-cols-4 gap-1 rounded-full p-1.5">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const TabIcon = tab.icon;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-[52px] flex-col items-center justify-center gap-0.5 rounded-full text-caption2 font-medium transition-colors active:opacity-60 ${
                  active ? "bg-white/[0.09] text-pos" : "text-ink-2"
                }`}
              >
                <TabIcon size={24} stroke={active ? 2 : 1.6} aria-hidden="true" />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
    </>
  );
}
