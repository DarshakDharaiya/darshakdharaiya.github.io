import type { Metadata } from "next";
import { site } from "@/data/site";

/**
 * Next merges metadata shallowly: a page that sets `openGraph` replaces the root's
 * entire block, and one that leaves `twitter` alone inherits the home page's card.
 * Every page builds both from here so neither half goes missing or goes stale.
 */

/**
 * Absolute URL for a route, ending in "/" to match `trailingSlash: true`. Without it
 * each sitemap entry points at a redirect rather than the canonical page.
 */
export function absoluteUrl(path: string) {
  const clean = path.replace(/^\/+|\/+$/g, "");
  return `${site.url}/${clean ? `${clean}/` : ""}`;
}

type PageSeo = {
  /** Used verbatim in social cards; the <title> gets the layout's template instead. */
  title: string;
  description: string;
  /** Route path, e.g. "/blog/some-post" */
  path: string;
  /** A 1200x630 PNG generated at build time */
  image: { url: string; alt: string };
  type?: "website" | "article";
  article?: { publishedTime: string; tags: readonly string[] };
  keywords?: readonly string[];
};

export function pageMetadata({ title, description, path, image, type = "website", article, keywords }: PageSeo): Metadata {
  const images = [{ url: image.url, width: 1200, height: 630, type: "image/png", alt: image.alt }];
  const url = absoluteUrl(path);
  return {
    description,
    ...(keywords && { keywords: [...keywords] }),
    alternates: { canonical: url },
    openGraph: {
      type,
      url,
      siteName: site.name,
      locale: "en_US",
      title,
      description,
      images,
      ...(article && {
        publishedTime: article.publishedTime,
        authors: [site.name],
        tags: [...article.tags],
      }),
    },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

/** The Person every page's structured data refers back to, by @id. */
export const personId = `${site.url}/#person`;

export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}
