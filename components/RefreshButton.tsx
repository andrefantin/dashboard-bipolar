"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { IconRefresh } from "@tabler/icons-react";

export default function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={isPending}
      className="glass inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-ink-2 transition-colors hover:text-ink disabled:opacity-60"
    >
      <IconRefresh
        size={15}
        aria-hidden="true"
        className={isPending ? "animate-spin-slow" : undefined}
      />
      {isPending ? "Atualizando…" : "Atualizar"}
    </button>
  );
}
