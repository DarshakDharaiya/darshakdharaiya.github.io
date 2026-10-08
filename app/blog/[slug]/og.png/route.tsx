import { ImageResponse } from "next/og";
import { getPost, posts } from "@/data/blog";
import { OgCard, ogSize } from "@/lib/og";

/** One preview card per post, so a shared link shows the post, not the portfolio. */
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function GET(_request: Request, ctx: RouteContext<"/blog/[slug]/og.png">) {
  const { slug } = await ctx.params;
  const post = getPost(slug);
  if (!post) return new Response("Not found", { status: 404 });

  return new ImageResponse(
    <OgCard eyebrow={post.category} title={post.title} kicker={post.tags.join(" · ")} />,
    ogSize,
  );
}
