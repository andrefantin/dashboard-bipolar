import { NextResponse } from "next/server";
import { fetchLatestRates } from "@/lib/awesomeapi";

export const revalidate = 300; // 5 min

export async function GET() {
  try {
    const rates = await fetchLatestRates();
    return NextResponse.json({ rates, fetchedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json(
      { error: "O dólar recusou-se a responder. Tente de novo em instantes." },
      { status: 502 }
    );
  }
}
