"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Marca + título compacto da barra superior (padrão "large title" do iOS).
 * No celular, quando o título grande da página (`[data-large-title]`) sai da
 * tela por baixo da barra, a marca dá lugar ao título da página, centralizado.
 * No desktop a marca fica sempre visível.
 */
export default function NavTitle() {
  const pathname = usePathname();
  const [title, setTitle] = useState<string | null>(null);

  useEffect(() => {
    setTitle(null);
    const el = document.querySelector<HTMLElement>("[data-large-title]");
    if (!el) return;
    const text = el.dataset.largeTitle || el.textContent?.trim() || "";
    // margem negativa = altura da barra: o título "some" quando passa por baixo dela
    const io = new IntersectionObserver(
      ([entry]) => setTitle(entry.isIntersecting ? null : text),
      { rootMargin: "-56px 0px 0px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [pathname]);

  return (
    <>
      <span
        className={`font-display text-headline font-semibold tracking-tight transition-opacity duration-200 md:opacity-100 ${
          title ? "opacity-0" : "opacity-100"
        }`}
      >
        Dólar Bipolar
      </span>
      {/* Duplicata visual do <h1>: decorativa para leitores de tela */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute left-1/2 top-1/2 max-w-[60%] -translate-x-1/2 -translate-y-1/2 truncate text-headline font-semibold transition-opacity duration-200 md:hidden ${
          title ? "opacity-100" : "opacity-0"
        }`}
      >
        {title}
      </span>
    </>
  );
}
