import { NextResponse } from "next/server";
import { fetchBovespa } from "@/lib/ibovespa";

export const revalidate = 300; // 5 min

// Pontuação oficial com BRAPI_TOKEN, calculada sem ele (ver lib/ibovespa);
// com erro upstream responde { quote: null }
// e a UI simplesmente omite o card — nunca um erro visível.
export async function GET() {
  const quote = await fetchBovespa();
  return NextResponse.json({ quote });
}
