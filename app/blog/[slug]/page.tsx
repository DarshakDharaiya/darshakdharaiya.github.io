import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPostDate, getPost, posts, sortedPosts } from "@/data/blog";
import { site } from "@/data/site";
import { PageTransition } from "@/components/layout/PageTransition";
import { ChapterNav } from "@/components/case-study/ChapterNav";
import { PostBody, headingId } from "@/components/blog/PostBody";
import { TextReveal } from "@/components/animations/TextReveal";
import { Reveal } from "@/components/animations/Reveal";
import { ArrowLeft, ArrowRight } from "@/components/ui/Icons";

export const dynamicParams = false;

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.tags,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: `${post.title} — ${site.name}`,
      description: post.excerpt,
      publishedTime: post.date,
      authors: [site.name],
      tags: [...post.tags],
      images: [{ url: `/blog/${post.slug}/og.png`, width: 1200, height: 630, type: "image/png" }],
    },
  };
}

export default async function BlogPostPage(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const post = getPost(slug);
  if (!post) notFound();

  const index = sortedPosts.findIndex((p) => p.slug === slug);
  const next = sortedPosts[(index + 1) % sortedPosts.length];

  // The nav mirrors the h2s in the body rather than a hand-kept list, so a new
  // section in the post data shows up here without a second edit.
  const chapters = post.body
    .filter((b) => b.type === "h2")
    .map((b) => ({ id: headingId(b.text), label: b.text }));

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: { "@type": "Person", name: site.name, url: site.url },
    keywords: post.tags.join(", "),
    mainEntityOfPage: `${site.url}/blog/${post.slug}`,
  };

  return (
    <PageTransition>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <main id="main" className="pb-section">
        {/* ───────── Header ───────── */}
        <header className="container-x pt-32 md:pt-40">
          <Link
            href="/#blog"
            transitionTypes={["page-back"]}
            className="group inline-flex items-center gap-2 text-sm text-fg-muted transition-colors hover:text-fg"
          >
            <ArrowLeft className="size-4 transition-transform duration-500 ease-out-expo group-hover:-translate-x-1" />
            All writing
          </Link>

          <div className="mt-12 max-w-4xl">
            <Reveal>
              <p className="eyebrow flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="text-fg">{post.category}</span>
                <span className="h-px w-8 bg-line-strong" aria-hidden />
                <time dateTime={post.date}>{formatPostDate(post.date)}</time>
                <span aria-hidden>·</span>
                <span>{post.readingMinutes} min read</span>
              </p>
            </Reveal>

            <TextReveal
              as="h1"
              text={post.title}
              by="words"
              immediate
              className="mt-8 text-h1 font-semibold text-balance"
            />

            <Reveal index={2}>
              <p className="mt-8 text-lead text-fg-muted text-balance">{post.excerpt}</p>
            </Reveal>

            <Reveal index={3}>
              <ul className="mt-8 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-pill border border-line px-3.5 py-1.5 font-mono text-xs text-fg-muted"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </header>

        {/* ───────── Body ───────── */}
        <div className="container-x mt-20 grid grid-cols-1 gap-16 md:mt-28 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-3">
            <ChapterNav chapters={chapters} />
          </div>

          <article className="min-w-0 lg:col-span-8 lg:col-start-5">
            <Reveal>
              <p className="border-l-2 border-accent pl-6 text-lead font-medium text-fg text-balance">
                {post.question}
              </p>
            </Reveal>

            <PostBody blocks={post.body} />

            {/* ───────── Takeaways ───────── */}
            <Reveal>
              <aside
                aria-labelledby="takeaways-title"
                className="glass mt-20 rounded-glass p-7 md:mt-24 md:p-9"
              >
                <h2 id="takeaways-title" className="eyebrow text-fg">
                  In short
                </h2>
                <ul className="mt-6 space-y-3.5">
                  {post.takeaways.map((t, i) => (
                    <li key={i} className="flex gap-4 text-fg-muted">
                      <span className="mt-[0.6em] shrink-0 font-mono text-xs text-fg-subtle" aria-hidden>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0">{t}</span>
                    </li>
                  ))}
                </ul>
              </aside>
            </Reveal>
          </article>
        </div>

        {/* ───────── Next post ───────── */}
        <nav aria-label="Next post" className="container-x mt-32 md:mt-44">
          <Link
            href={`/blog/${next.slug}`}
            transitionTypes={["page-forward"]}
            data-cursor="label"
            data-cursor-label="READ →"
            className="group flex flex-col gap-6 border-t border-line pt-10 transition-colors duration-500 hover:border-line-strong md:flex-row md:items-end md:justify-between"
          >
            <div className="min-w-0">
              <p className="eyebrow">Next</p>
              <p className="mt-4 text-h3 font-semibold text-balance transition-colors duration-500 group-hover:text-accent">
                {next.title}
              </p>
            </div>
            <span
              className="flex items-center gap-3 text-fg-muted transition-all duration-500 ease-out-expo group-hover:translate-x-1 group-hover:text-fg"
              aria-hidden
            >
              {next.readingMinutes} min
              <ArrowRight className="size-5" />
            </span>
          </Link>
        </nav>
      </main>
    </PageTransition>
  );
}
