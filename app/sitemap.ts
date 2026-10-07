import type { MetadataRoute } from "next";
import { featuredProjects } from "@/data/projects";
import { site } from "@/data/site";

/** Emitted as a file at build time for the static export. */
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: site.url, changeFrequency: "monthly", priority: 1 },
    ...featuredProjects.map((p) => ({
      url: `${site.url}/work/${p.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.8,
    })),
  ];
}
