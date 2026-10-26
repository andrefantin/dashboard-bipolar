import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// CSP: só o que o site realmente carrega — o próprio domínio e o Google
// Analytics. 'unsafe-inline' em script/style é necessário para os scripts
// inline do Next, do gtag e do JSON-LD, e para os <style> que o BorderBeam
// injeta; o ganho real aqui é bloquear scripts de qualquer outra origem,
// plugins, <base> sequestrado e o site em iframe alheio. Em dev o Next
// precisa de eval e do websocket de recarga.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://www.googletagmanager.com https://*.google-analytics.com",
  "font-src 'self'",
  `connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com${isDev ? " ws:" : ""}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Sem iframe de terceiros (clickjacking) — redundante com frame-ancestors,
  // mantido para navegadores antigos.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

// Endereços do site v1 (Webflow) que o Google pode ainda ter indexados.
// Redirecionamento permanente (308) para a página equivalente da v2, para
// não perder o tráfego de busca; cada um com e sem ".html".
const V1_PAGES: Record<string, string> = {
  index: "/",
  sobre: "/sobre",
  contato: "/sobre#contato",
  "acompanhe-a-cotacao-do-dolar-e-do-real": "/",
  "cotacao-dolar-tempo-real-influencias-tendencias": "/duvidas",
  "cotacao-euro-real": "/moeda/eur",
  "como-funciona-cotacao-libra-esterlina-frente-real": "/moeda/gbp",
  "design-tokens": "/",
};

const v1Redirects = Object.entries(V1_PAGES).flatMap(([page, destination]) =>
  [`/${page}.html`, `/${page}`]
    // /sobre já existe na v2: sem regra para ele mesmo
    .filter((source) => source !== destination)
    .map((source) => ({ source, destination, permanent: true }))
);

const nextConfig: NextConfig = {
  // Não anunciar o framework (x-powered-by: Next.js)
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return v1Redirects;
  },
};

export default nextConfig;
