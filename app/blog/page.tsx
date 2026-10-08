import type { Metadata } from "next";
import Link from "next/link";
import { sortedPosts } from "@/data/blog";
import { site } from "@/data/site";
import { PageTransition } from "@/components/layout/PageTransition";
import { PostCard } from "@/components/sections/blog/PostCard";
import { TextReveal } from "@/components/animations/TextReveal";
import { Reveal } from "@/components/animations/Reveal";
import { ArrowLeft } from "@/components/ui/Icons";

const description =
  "Problems hit in production building Android apps, what the fix turned out to be, and the platform changes worth reading before they land on you.";

export const metadata: Metadata = {
  title: "Writing",
  description,
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    title: `Writing — ${site.name}`,
    description,
  },
};

/**
 * The index for /blog. The home page carries the same list at #blog, but a bare
 * /blog is the first thing anyone shortens a post URL to, and it used to 404.
 */
export default function BlogIndexPage() {
  return (
    <PageTransition>
      <main id="main" className="pb-section">
        <header className="container-x pt-32 md:pt-40">
          <Link
            href="/"
            transitionTypes={["page-back"]}
            className="group inline-flex items-center gap-2 text-sm text-fg-muted transition-colors hover:text-fg"
          >
            <ArrowLeft className="size-4 transition-transform duration-500 ease-out-expo group-hover:-translate-x-1" />
            Back to portfolio
          </Link>

          <div className="mt-12 max-w-3xl">
            <Reveal>
              <p className="eyebrow">Writing</p>
            </Reveal>
            <TextReveal
              as="h1"
              text={["Notes from", "shipping Android."]}
              by="words"
              immediate
              className="mt-6 text-h1 font-semibold text-balance"
            />
            <Reveal index={2}>
              <p className="mt-8 text-lead text-fg-muted text-balance">{description}</p>
            </Reveal>
          </div>
        </header>

        <div className="container-x mt-20 border-b border-line md:mt-28">
          {sortedPosts.map((post, i) => (
            <Reveal key={post.slug} index={i % 4}>
              <PostCard post={post} index={i} />
            </Reveal>
          ))}
        </div>
      </main>
    </PageTransition>
  );
}
