import type { Metadata } from "next";

const SITE_NAME = "Dólar Bipolar";

interface PageMetadataInput {
  /** título da aba; recebe " — Dólar Bipolar" pelo template, salvo `absolute` */
  title: string;
  description: string;
  /** caminho da página, ex.: "/moeda/eur" (vira canonical e og:url) */
  path: string;
  /** título já completo (a home, que leva a cotação ao vivo no título) */
  absolute?: boolean;
  /** Páginas sem opengraph-image próprio precisam apontar um: com `openGraph`
   *  definido, o do layout deixa de ser herdado. Usamos o da home (dólar ao
   *  vivo + humor). Home e moedas têm o seu e não passam nada. */
  shareImage?: boolean;
}

/**
 * Metadados completos de uma página: título, descrição, canonical e os
 * cartões de compartilhamento (Open Graph / Twitter).
 *
 * Em Next, um `openGraph` definido na página substitui o do layout inteiro
 * (não mescla). Sem isto, toda página herdava título, descrição e og:url da
 * home — um link do euro compartilhado no Bluesky aparecia como "Cotação do
 * dólar hoje" e apontava para a home. A imagem (og:image) vem dos arquivos
 * opengraph-image de cada rota.
 */
export function pageMetadata({ title, description, path, absolute = false, shareImage = false }: PageMetadataInput): Metadata {
  const fullTitle = absolute ? title : `${title} — ${SITE_NAME}`;
  return {
    title: absolute ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: SITE_NAME,
      url: path,
      title: fullTitle,
      description,
      ...(shareImage && {
        images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Cotação do dólar hoje — Dólar Bipolar" }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      site: "@dolarbipolar",
      title: fullTitle,
      description,
    },
  };
}
