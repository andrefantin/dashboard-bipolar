import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

// Ícones do app (Tela de Início do iPhone + manifest), gerados no build.
// O mascote é transparente e o iOS pinta transparência de preto, então ele
// vai sobre o fundo da marca. O iOS arredonda os cantos sozinho.
const SIZES = [180, 192, 512] as const;

export const dynamic = "force-static";

export function generateStaticParams() {
  return SIZES.map((size) => ({ size: String(size) }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const size = Number((await params).size);
  if (!SIZES.includes(size as (typeof SIZES)[number])) {
    return new Response("Not found", { status: 404 });
  }

  const png = await readFile(path.join(process.cwd(), "public", "mascote", "default.png"));
  const mascot = `data:image/png;base64,${png.toString("base64")}`;
  const art = Math.round(size * 0.78);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at 50% 38%, #1d3a2f 0%, #0b1210 72%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mascot} width={art} height={art} alt="" />
      </div>
    ),
    { width: size, height: size }
  );
}
