import { ImageResponse } from "next/og";
import { featuredProjects, getProject } from "@/data/projects";
import { OgCard, ogSize } from "@/lib/og";

/**
 * One preview card per case study. This replaces the old behaviour of pointing
 * Open Graph at the first screenshot: those are 720×1280 portrait phone shots,
 * which every platform crops to an unreadable sliver at 1.91:1.
 */
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return featuredProjects.map((p) => ({ slug: p.slug }));
}

export async function GET(_request: Request, ctx: RouteContext<"/work/[slug]/og.png">) {
  const { slug } = await ctx.params;
  const project = getProject(slug);
  if (!project) return new Response("Not found", { status: 404 });

  return new ImageResponse(
    <OgCard eyebrow="Case study" title={project.title} kicker={project.tagline} />,
    ogSize,
  );
}
