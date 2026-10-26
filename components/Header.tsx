import TransitionLink from "./TransitionLink";
import Image from "next/image";
import { IconArrowUpRight, IconBrandBluesky } from "@tabler/icons-react";
import NavTitle from "./NavTitle";

export const PROFILE_URL = "https://bsky.app/profile/dolarbipolar.com";

// Só no desktop: no celular a navegação mora na barra de abas inferior (TabBar).
const NAV = [
  { href: "/", label: "Home" },
  { href: "/comparar", label: "Comparar" },
  { href: "/duvidas", label: "Dúvidas" },
  { href: "/sobre", label: "Sobre" },
  { href: "/sobre#contato", label: "Contato" },
];

export default function Header() {
  return (
    <header className="site-header sticky top-0 z-20 border-b border-white/5 bg-bg/75 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="relative mx-auto flex h-[52px] max-w-6xl items-center gap-3 px-4 sm:px-6">
        <TransitionLink nav="tab" href="/" className="flex shrink-0 items-center gap-2" aria-label="Dólar Bipolar: início">
          <Image
            src="/mascote/default.webp"
            alt=""
            width={28}
            height={28}
            className="rounded-full"
          />
          <NavTitle />
        </TransitionLink>

        <nav
          aria-label="Navegação principal"
          className="ml-auto hidden items-center gap-1 text-sm md:flex"
        >
          {NAV.map((item) => (
            <TransitionLink
              key={item.href}
              nav="tab"
              href={item.href}
              className="whitespace-nowrap rounded-lg px-2.5 py-1.5 text-ink-2 transition-colors hover:bg-white/5 hover:text-ink"
            >
              {item.label}
            </TransitionLink>
          ))}
          <a
            href={PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 font-medium text-pos transition-colors hover:bg-pos/10"
          >
            Ir para perfil
            <IconArrowUpRight size={14} aria-hidden="true" />
          </a>
        </nav>

        {/* Celular: atalho para o perfil no canto, como um botão de barra do iOS */}
        <a
          href={PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Ir para o perfil no Bluesky"
          className="-mr-2 ml-auto flex h-11 w-11 items-center justify-center rounded-full text-pos transition-opacity active:opacity-60 md:hidden"
        >
          <IconBrandBluesky size={22} aria-hidden="true" />
        </a>
      </div>
    </header>
  );
}
