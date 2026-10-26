"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { IconRefresh } from "@tabler/icons-react";

/** No celular é um botão só de ícone (como os de barra do iOS, alvo de 44px);
 *  no desktop mostra o rótulo "Atualizar". */
export default function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={isPending}
      className="glass inline-flex h-11 w-11 shrink-0 items-center justify-center gap-2 text-sm font-medium text-ink-2 transition-colors hover:text-ink active:opacity-60 disabled:opacity-60 md:h-auto md:w-auto md:px-3 md:py-1.5"
    >
      <IconRefresh
        size={18}
        aria-hidden="true"
        className={isPending ? "animate-spin-slow" : undefined}
      />
      <span className="sr-only md:not-sr-only">{isPending ? "Atualizando…" : "Atualizar"}</span>
    </button>
  );
}
