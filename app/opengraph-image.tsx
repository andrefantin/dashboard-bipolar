import { ImageResponse } from "next/og";

export const alt = "Dólar Bipolar — cotação do dólar hoje";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background:
            "radial-gradient(ellipse 60% 50% at 30% 10%, rgba(52,211,153,0.25), transparent), linear-gradient(180deg, #0b1210, #101a16)",
          color: "#e8edea",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 30, color: "#9db2a8", letterSpacing: 4 }}>
          ÍNDICE DE HUMOR DO DÓLAR
        </div>
        <div style={{ fontSize: 96, fontWeight: 700, marginTop: 12 }}>
          Dólar Bipolar
        </div>
        <div style={{ fontSize: 38, color: "#34d399", marginTop: 16 }}>
          Cotação do dólar hoje — câmbio em tempo real, humor incluso.
        </div>
      </div>
    ),
    size
  );
}
