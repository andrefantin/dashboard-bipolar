import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dólar Bipolar",
    short_name: "Dólar Bipolar",
    description: "Cotação do dólar em tempo real, com humor incluso.",
    lang: "pt-BR",
    start_url: "/",
    display: "standalone",
    background_color: "#0b1210",
    theme_color: "#0b1210",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png" },
    ],
  };
}
