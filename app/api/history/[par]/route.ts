import { NextResponse } from "next/server";
import { fetchDailyHistory, getCurrency } from "@/lib/awesomeapi";

export const revalidate = 21600; // 6 h

const ALLOWED_DAYS = new Set([7, 30, 90, 365]);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ par: string }> }
) {
  const { par } = await params;
  const currency = getCurrency(par);
  if (!currency) {
    return NextResponse.json({ error: "Moeda desconhecida" }, { status: 404 });
  }
  const daysParam = new URL(request.url).searchParams.get("days");
  const days = daysParam ? parseInt(daysParam, 10) : 30;
  if (!ALLOWED_DAYS.has(days)) {
    return NextResponse.json({ error: "Período inválido" }, { status: 400 });
  }
  try {
    const series = await fetchDailyHistory(currency.code, days);
    return NextResponse.json({ code: currency.code, days, series });
  } catch {
    return NextResponse.json(
      { error: "Histórico indisponível no momento." },
      { status: 502 }
    );
  }
}
