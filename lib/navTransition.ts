// Transições de página com a View Transitions API, ao estilo do iOS:
//   push — a tela nova entra pela direita (lista → moeda)
//   pop  — a tela atual sai pela direita (moeda → lista)
//   tab  — troca de aba: só um fade curto (o iOS não desliza entre abas)
// A tela inteira se move como uma peça só. Já houve elemento compartilhado
// (ícone e preço voando da linha para o cabeçalho), mas as duas pontas não
// eram iguais o bastante e o movimento ficava estranho — foi removido.
//
// O navegador captura a tela antiga, chama nosso callback e espera a promessa
// dele resolver para capturar a nova. Quem resolve é o NavigationTransitions,
// quando a rota nova já está no DOM.

export type NavKind = "push" | "pop" | "tab";

interface Pending {
  nav: NavKind;
  /** no pop: slug da moeda de onde voltamos, para rolar até a linha dela */
  returnTo?: string;
  resolve: () => void;
}

let pending: Pending | null = null;

/** Sem suporte (Safari < 18, Firefox antigo) ou com Reduzir Movimento ligado:
 *  navegação normal, sem animação. */
export function canAnimateNavigation(): boolean {
  return (
    typeof document !== "undefined" &&
    "startViewTransition" in document &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function navigateWithTransition(
  push: (href: string, options?: { scroll?: boolean }) => void,
  href: string,
  nav: NavKind,
  returnTo?: string
) {
  const root = document.documentElement;
  root.dataset.nav = nav;

  const transition = document.startViewTransition(
    () =>
      new Promise<void>((resolve) => {
        // Rede pendurada não pode congelar a tela: depois de 3s segue sem animar
        const timer = window.setTimeout(done, 3000);
        function done() {
          window.clearTimeout(timer);
          pending = null;
          resolve();
        }
        pending = { nav, returnTo, resolve: done };
        // No pop a rolagem é nossa (ver completeNavigationTransition)
        push(href, nav === "pop" ? { scroll: false } : undefined);
      })
  );

  transition.finished.finally(() => {
    delete root.dataset.nav;
  });
}

/** Chamado quando a rota nova já está no DOM (NavigationTransitions). */
export function completeNavigationTransition() {
  const p = pending;
  if (!p) return;
  if (p.nav === "pop") {
    // Voltando para a lista: centraliza a linha da moeda de onde viemos, para
    // o usuário não perder onde estava (como a pilha de navegação do iOS).
    // Sem linha (ex.: dólar, que fica no topo), volta ao topo.
    const row = p.returnTo
      ? document.querySelector<HTMLElement>(`[data-row="${p.returnTo}"]`)
      : null;
    if (row) row.scrollIntoView({ block: "center" });
    else window.scrollTo(0, 0);
  }
  p.resolve();
}
