import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { SITE_URL } from "./site";
import { isGoodChange } from "./tone";

// Cartão de compartilhamento (og:image, 1200×630) com a cotação ao vivo —
// é o que aparece quando alguém posta o link no Bluesky, Twitter ou WhatsApp,
// de onde vem a maior parte do tráfego.

export const OG_SIZE = { width: 1200, height: 630 };

const INK = "#e8edea";
const INK_2 = "#9db2a8";
const POS = "#34d399";
const NEG = "#f87171";

/** O renderizador (Satori) não lê WebP, por isso a cópia em PNG. No build o
 *  arquivo está no disco; nas revalidações na Vercel, public/ não está no
 *  disco da função, então busca pela URL pública. Sem imagem, o cartão sai
 *  só com texto. */
const DEFAULT_MASCOT = "humor-og.png";

async function loadPng(file: string): Promise<string | null> {
  try {
    const buf = await readFile(path.join(process.cwd(), "public", "mascote", file));
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    try {
      const res = await fetch(`${SITE_URL}/mascote/${file}`, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) return null;
      return `data:image/png;base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
    } catch {
      return null;
    }
  }
}

/** A figura pedida (a do humor do dia) e, se faltar, a padrão. */
async function mascotDataUrl(file?: string): Promise<string | null> {
  return (file && (await loadPng(file))) || loadPng(DEFAULT_MASCOT);
}

interface OgCardInput {
  /** linha pequena no topo, ex.: "Cotação do dólar hoje" */
  overline: string;
  /** o número grande, já formatado ("R$ 5,35") — null quando a API falhou */
  price: string | null;
  /** variação do dia em % */
  pct: number | null;
  /** linha de rodapé (humor do dólar, lote…) */
  footnote?: string;
  /** cor do rodapé e do brilho de fundo */
  accent?: string;
  /** PNG da figura em public/mascote (ex.: "humor-og-furioso.png"); sem ele, a padrão */
  mascot?: string;
}

export async function renderOgCard({ overline, price, pct, footnote, accent = POS, mascot: mascotFile }: OgCardInput) {
  const mascot = await mascotDataUrl(mascotFile);
  const up = (pct ?? 0) >= 0;
  // Cor pelo leitor (moeda mais barata = verde), como no site; ver lib/tone
  const good = isGoodChange(pct ?? 0);
  const pctText =
    pct === null
      ? null
      : `${up ? "+" : "−"}${Math.abs(pct).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}% hoje`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 64px 0 80px",
          color: INK,
          fontFamily: "sans-serif",
          background: `radial-gradient(ellipse 70% 60% at 20% 10%, ${accent}33, transparent), linear-gradient(180deg, #0b1210, #101a16)`,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 680 }}>
          <div style={{ fontSize: 26, letterSpacing: 5, color: INK_2 }}>DÓLAR BIPOLAR</div>
          <div style={{ fontSize: 44, marginTop: 28 }}>{overline}</div>
          <div style={{ fontSize: price && price.length > 11 ? 104 : 132, fontWeight: 700, marginTop: 8, letterSpacing: -2 }}>
            {price ?? "—"}
          </div>
          {pctText && (
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                marginTop: 18,
                padding: "8px 22px",
                borderRadius: 999,
                fontSize: 34,
                color: good ? POS : NEG,
                background: good ? "rgba(52,211,153,0.14)" : "rgba(248,113,113,0.14)",
              }}
            >
              {pctText}
            </div>
          )}
          {footnote && <div style={{ fontSize: 32, marginTop: 34, color: accent }}>{footnote}</div>}
        </div>
        {mascot && (
          // eslint-disable-next-line @next/next/no-img-element
          // Caixa fixa com contain: as figuras de cada humor têm proporções diferentes
          <img src={mascot} width={480} height={520} alt="" style={{ objectFit: "contain", objectPosition: "bottom" }} />
        )}
      </div>
    ),
    OG_SIZE
  );
}
