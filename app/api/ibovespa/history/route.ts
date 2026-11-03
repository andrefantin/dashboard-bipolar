import { NextResponse } from "next/server";
import { fetchBovespa, fetchIbovespaHistory, withLiveIbovespa } from "@/lib/ibovespa";

export const revalidate = 21600; // 6 h — a B3 publica um fechamento por dia

const ALLOWED_DAYS = new Set([7, 30, 90, 365]);

export async function GET(request: Request) {
  const daysParam = new URL(request.url).searchParams.get("days");
  const days = daysParam ? parseInt(daysParam, 10) : 30;
  if (!ALLOWED_DAYS.has(days)) {
    return NextResponse.json({ error: "Período inválido" }, { status: 400 });
  }
  try {
    // Fechamentos oficiais + o pregão de hoje, como na carga da página
    const [history, quote] = await Promise.all([fetchIbovespaHistory(days), fetchBovespa()]);
    return NextResponse.json({ days, series: withLiveIbovespa(history, quote) });
  } catch {
    return NextResponse.json({ error: "Histórico indisponível no momento." }, { status: 502 });
  }
}
