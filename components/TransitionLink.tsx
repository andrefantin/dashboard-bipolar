"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { canAnimateNavigation, navigateWithTransition, type NavKind } from "@/lib/navTransition";

type TransitionLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
  /** que animação usar: push, pop ou tab (ver lib/navTransition) */
  nav: NavKind;
  /** no pop: slug da moeda cuja linha a lista deve centralizar ao voltar */
  returnTo?: string;
};

/** <Link> do Next com transição de página. Mantém o prefetch do Link e cai
 *  na navegação normal quando a animação não se aplica. */
export default function TransitionLink({ nav, returnTo, onClick, ...props }: TransitionLinkProps) {
  const router = useRouter();

  return (
    <Link
      {...props}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        // Cmd/Ctrl/Shift/clique do meio: nova aba/janela, como sempre
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (!canAnimateNavigation()) return;
        // Mesma página (ex.: aba atual): nada a animar, e a transição ficaria
        // esperando uma troca de rota que não vem
        if (new URL(props.href, location.href).pathname === location.pathname) return;
        e.preventDefault();
        navigateWithTransition((href, options) => router.push(href, options), props.href, nav, returnTo);
      }}
    />
  );
}
