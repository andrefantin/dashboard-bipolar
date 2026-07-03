import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import Header, { PROFILE_URL } from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";

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

const SITE_URL = "https://dolarbipolar.com";

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
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Dólar Bipolar",
    url: SITE_URL,
    title: "Cotação do dólar hoje — Dólar Bipolar",
    description:
      "Cotação do dólar em tempo real, histórico, notícias e o Índice de Humor do Dólar.",
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
};

export const viewport: Viewport = {
  themeColor: "#0b1210",
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
      <body className="antialiased flex min-h-dvh flex-col">
        <JsonLd data={ORGANIZATION_SCHEMA} />
        <JsonLd data={WEBSITE_SCHEMA} />
        <Header />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 sm:px-6">
          {children}
        </main>
        <Footer />
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-ZFJVEXNH6X"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-ZFJVEXNH6X');`}
        </Script>
      </body>
    </html>
  );
}
