import { NextResponse } from "next/server";
import { fetchBovespa } from "@/lib/awesomeapi";

export const revalidate = 300; // 5 min

// Opcional: sem BRAPI_TOKEN (ou com erro upstream) responde { quote: null }
// e a UI simplesmente omite o card — nunca um erro visível.
export async function GET() {
  const quote = await fetchBovespa();
  return NextResponse.json({ quote });
}
