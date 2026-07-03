import { NextResponse } from "next/server";
import { fetchNews } from "@/lib/news";

export const revalidate = 1800; // 30 min

export async function GET() {
  try {
    const items = await fetchNews();
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json(
      { error: "As manchetes não chegaram. Tente de novo em instantes." },
      { status: 502 }
    );
  }
}
