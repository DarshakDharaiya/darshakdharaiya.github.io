import type { MetadataRoute } from "next";
import { featuredProjects } from "@/data/projects";
import { sortedPosts } from "@/data/blog";
import { site } from "@/data/site";

/** Emitted as a file at build time for the static export. */
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: site.url, changeFrequency: "monthly", priority: 1 },
    { url: `${site.url}/blog`, changeFrequency: "monthly" as const, priority: 0.7 },
    ...featuredProjects.map((p) => ({
      url: `${site.url}/work/${p.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.8,
    })),
    ...sortedPosts.map((p) => ({
      url: `${site.url}/blog/${p.slug}`,
      lastModified: new Date(`${p.date}T00:00:00Z`),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
