import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import Header, { PROFILE_URL } from "@/components/Header";
import Footer from "@/components/Footer";
import TabBar from "@/components/TabBar";
import NavigationTransitions from "@/components/NavigationTransitions";
import JsonLd from "@/components/JsonLd";
import { SITE_URL } from "@/lib/site";

// Fontes auto-hospedadas (Fontshare/ITF) — sem CSS de terceiros no caminho crítico
const clashDisplay = localFont({
  src: [
    { path: "./fonts/clash-display-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/clash-display-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-clash",
  display: "swap",
  fallback: ["Avenir Next", "system-ui", "sans-serif"],
});

const satoshi = localFont({
  src: [
    { path: "./fonts/satoshi-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/satoshi-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/satoshi-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-satoshi",
  display: "swap",
  fallback: ["Inter", "system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Cotação do dólar hoje — Dólar Bipolar",
    template: "%s — Dólar Bipolar",
  },
  description:
    "Cotação do dólar, euro e outras moedas em tempo real, com histórico, notícias e o Índice de Humor do Dólar. O dashboard do perfil satírico @dolarbipolar.",
  keywords: [
    "cotação do dólar",
    "dólar hoje",
    "dólar agora",
    "câmbio",
    "dólar comercial",
    "cotação euro",
    "dólar real",
  ],
  // canonical, og:url, og:title e og:description são de cada página (lib/seo).
  // Um canonical aqui seria herdado até pela página 404.
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Dólar Bipolar",
  },
  twitter: {
    card: "summary_large_image",
    site: "@dolarbipolar",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  // Declarar `icons` desliga o <link rel="icon"> automático do app/icon.png,
  // então o favicon vai explícito junto com o ícone do iPhone.
  icons: {
    icon: [{ url: "/icon.png", sizes: "32x32", type: "image/png" }],
    apple: "/icons/180",
  },
  // "Adicionar à Tela de Início" no iPhone abre como app, em tela cheia
  appleWebApp: {
    capable: true,
    title: "Dólar Bipolar",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1210",
  // conteúdo vai até as bordas; header e TabBar compensam com env(safe-area-inset-*)
  viewportFit: "cover",
};

const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Dólar Bipolar",
  url: SITE_URL,
  logo: `${SITE_URL}/mascote/default.webp`,
  description:
    "Perfil satírico de economia que divulga a cotação do dólar no Bluesky.",
  sameAs: [PROFILE_URL, "https://twitter.com/dolarbipolar"],
};

const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Dólar Bipolar",
  url: SITE_URL,
  inLanguage: "pt-BR",
  description:
    "Cotação do dólar e outras moedas em tempo real, com histórico, notícias e o Índice de Humor do Dólar.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${clashDisplay.variable} ${satoshi.variable}`}>
      {/* pb no celular: espaço para a TabBar flutuante e o desfoque atrás dela.
          104px deixa o fim da página acima do desfoque forte, que começa ~100px
          acima da borda; só a faixa mais leve (1–2px) toca o último conteúdo. */}
      <body className="antialiased flex min-h-dvh flex-col pb-[calc(104px+env(safe-area-inset-bottom))] md:pb-0">
        <JsonLd data={ORGANIZATION_SCHEMA} />
        <JsonLd data={WEBSITE_SCHEMA} />
        <Header />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-12 sm:px-6 md:pb-16">
          {children}
        </main>
        <Footer />
        <TabBar />
        <NavigationTransitions />
        {/* Google Analytics depois do load, com a página ociosa: o gtag são
            ~170 KB e ~380 ms de script que disputavam a primeira pintura no
            celular (Lighthouse). As visitas continuam contadas. */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-ZFJVEXNH6X"
          strategy="lazyOnload"
        />
        <Script id="gtag-init" strategy="lazyOnload">
          {`window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-ZFJVEXNH6X');`}
        </Script>
      </body>
    </html>
  );
}
