import type { MetadataRoute } from "next";
import { featuredProjects } from "@/data/projects";
import { sortedPosts } from "@/data/blog";
import { absoluteUrl } from "@/lib/seo";

/** Emitted as a file at build time for the static export. */
export const dynamic = "force-static";

const postDate = (date: string) => new Date(`${date}T00:00:00Z`);

export default function sitemap(): MetadataRoute.Sitemap {
  // The home page and the index both list posts, so they change when one is published.
  const latestPost = sortedPosts[0] && postDate(sortedPosts[0].date);
  return [
    { url: absoluteUrl("/"), lastModified: latestPost, changeFrequency: "monthly", priority: 1 },
    { url: absoluteUrl("/blog"), lastModified: latestPost, changeFrequency: "monthly", priority: 0.7 },
    ...featuredProjects.map((p) => ({
      url: absoluteUrl(`/work/${p.slug}`),
      changeFrequency: "yearly" as const,
      priority: 0.8,
    })),
    ...sortedPosts.map((p) => ({
      url: absoluteUrl(`/blog/${p.slug}`),
      lastModified: postDate(p.date),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
