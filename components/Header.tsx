import Link from "next/link";
import Image from "next/image";
import { IconArrowUpRight } from "@tabler/icons-react";

export const PROFILE_URL = "https://bsky.app/profile/dolarbipolar.com";

const NAV = [
  { href: "/", label: "Home", mobileHidden: false },
  { href: "/comparar", label: "Comparar", mobileHidden: false },
  { href: "/duvidas", label: "Dúvidas", mobileHidden: false },
  { href: "/sobre", label: "Sobre", mobileHidden: false },
  // Contato mora dentro de /sobre — no mobile a nav não precisa dos dois
  { href: "/sobre#contato", label: "Contato", mobileHidden: true },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image
            src="/mascote/default.webp"
            alt=""
            width={28}
            height={28}
            className="rounded-full"
          />
          <span className="font-display text-lg font-semibold tracking-tight">
            Dólar Bipolar
          </span>
        </Link>
        <nav
          aria-label="Navegação principal"
          className="no-scrollbar nav-fade ml-auto flex items-center gap-1 overflow-x-auto text-sm"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-ink-2 transition-colors hover:bg-white/5 hover:text-ink ${
                item.mobileHidden ? "hidden sm:block" : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
          <a
            href={PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 font-medium text-pos transition-colors hover:bg-pos/10"
          >
            <span className="hidden sm:inline">Ir para perfil</span>
            <span className="sm:hidden">Perfil</span>
            <IconArrowUpRight size={14} aria-hidden="true" />
          </a>
        </nav>
      </div>
    </header>
  );
}
