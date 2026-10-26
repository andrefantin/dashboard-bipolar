// Transições de página com a View Transitions API, ao estilo do iOS:
//   push — a tela nova entra pela direita (lista → moeda)
//   pop  — a tela atual sai pela direita (moeda → lista)
//   tab  — troca de aba: só um fade curto (o iOS não desliza entre abas)
// O ícone da moeda tocada "viaja" entre a linha da lista e o cabeçalho da
// página da moeda (elemento compartilhado). O preço não: na linha ele é
// Satoshi 16px à direita, no cabeçalho Clash 40px à esquerda — o navegador
// escala um *instantâneo*, então o número esticava 2,5× trocando de fonte e
// cruzava a tela na diagonal. Só morfa o que é igual nas duas pontas.
//
// O navegador captura a tela antiga, chama nosso callback e espera a promessa
// dele resolver para capturar a nova. Quem resolve é o NavigationTransitions,
// quando a rota nova já está no DOM.

export type NavKind = "push" | "pop" | "tab";

interface Pending {
  nav: NavKind;
  currency?: string;
  resolve: () => void;
}

let pending: Pending | null = null;

const SHARED = ["icon"] as const;

/** Dá `view-transition-name` só ao ícone da moeda que viaja.
 *  Se todas as linhas tivessem nome, cada ícone viraria uma camada
 *  separada e ficaria parado enquanto a página desliza. */
function nameSharedElements(currency?: string) {
  for (const part of SHARED) {
    document.querySelectorAll<HTMLElement>(`[data-vt-${part}]`).forEach((el) => {
      const match = currency && el.getAttribute(`data-vt-${part}`) === currency;
      if (match) el.style.setProperty("view-transition-name", `cur-${part}`);
      else el.style.removeProperty("view-transition-name");
    });
  }
}

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
  currency?: string
) {
  const root = document.documentElement;
  root.dataset.nav = nav;
  nameSharedElements(currency); // tela antiga: nomes antes da captura

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
        pending = { nav, currency, resolve: done };
        // No pop a rolagem é nossa (ver completeNavigationTransition)
        push(href, nav === "pop" ? { scroll: false } : undefined);
      })
  );

  transition.finished.finally(() => {
    delete root.dataset.nav;
    nameSharedElements(undefined);
  });
}

/** Chamado quando a rota nova já está no DOM (NavigationTransitions). */
export function completeNavigationTransition() {
  const p = pending;
  if (!p) return;
  if (p.nav === "pop" && p.currency) {
    // Voltando para a lista: centraliza a linha de onde viemos, para o ícone
    // pousar no lugar certo (e o usuário não perder onde estava).
    const target = document.querySelector<HTMLElement>(`[data-vt-icon="${p.currency}"]`);
    target?.scrollIntoView({ block: "center" });
  }
  nameSharedElements(p.currency); // tela nova: nomes antes da captura
  p.resolve();
}
