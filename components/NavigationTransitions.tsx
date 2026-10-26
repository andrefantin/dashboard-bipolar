"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";
import { completeNavigationTransition } from "@/lib/navTransition";

/** Avisa a transição de página em andamento que a rota nova já está no DOM.
 *  Fica no fim do <body>: os efeitos de layout rodam depois dos da página
 *  (inclusive a rolagem para o topo do Next), então a captura sai certa. */
export default function NavigationTransitions() {
  const pathname = usePathname();
  useLayoutEffect(() => {
    completeNavigationTransition();
  }, [pathname]);
  return null;
}
