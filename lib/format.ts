// Helpers de formatação pt-BR. Todas as datas usam o fuso de São Paulo
// para que servidor (UTC na Vercel) e cliente rendam o mesmo texto.
export const TIMEZONE = "America/Sao_Paulo";

export function formatBRL(value: number, decimals = 2): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/** "+0,45%" / "−1,20%" — sinal sempre explícito. */
export function formatPct(value: number, decimals = 2): string {
  const formatted = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    signDisplay: "always",
  }).format(value);
  return `${formatted}%`;
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIMEZONE,
  }).format(date);
}

/** "02/07" */
export function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: TIMEZONE,
  }).format(date);
}

/** "2 de julho" */
export function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    timeZone: TIMEZONE,
  }).format(date);
}

/** Chave de agrupamento por dia no fuso de SP: "2026-07-02". */
export function dayKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: TIMEZONE,
  }).format(date);
}

/** "agora", "há 35 min", "há 2 horas", "há 3 dias". */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  const diffMin = Math.round((now.getTime() - then) / 60_000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return diffHours === 1 ? "há 1 hora" : `há ${diffHours} horas`;
  const diffDays = Math.round(diffHours / 24);
  return diffDays === 1 ? "há 1 dia" : `há ${diffDays} dias`;
}
