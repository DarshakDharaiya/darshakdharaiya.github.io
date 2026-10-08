import Link from "next/link";
import type { Post } from "@/data/types";
import { formatPostDate } from "@/data/blog";
import { ArrowRight } from "@/components/ui/Icons";
import { pad2 } from "@/lib/utils";

/**
 * One post in the Blog list. Deliberately text-only — posts have no cover art,
 * and inventing some would be decoration standing in for content.
 */
export function PostCard({ post, index }: { post: Post; index: number }) {
  return (
    <article>
      <Link
        href={`/blog/${post.slug}`}
        transitionTypes={["page-forward"]}
        data-cursor="label"
        data-cursor-label="READ →"
        className="group block rounded-glass focus-visible:outline-offset-8"
      >
        <div className="flex flex-col gap-5 border-t border-line py-9 transition-colors duration-500 group-hover:border-line-strong md:flex-row md:gap-12 md:py-11">
          <div className="flex items-center gap-4 md:w-40 md:shrink-0 md:flex-col md:items-start md:gap-3">
            <span className="font-mono text-sm text-fg-subtle">{pad2(index + 1)}</span>
            <span className="rounded-pill border border-line px-3 py-1 text-xs text-fg-muted">
              {post.category}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-h3 font-semibold text-balance transition-colors duration-500 group-hover:text-accent">
              {post.title}
            </h3>
            <p className="mt-3 max-w-2xl text-fg-muted text-balance">{post.excerpt}</p>

            <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-fg-subtle">
              <time dateTime={post.date}>{formatPostDate(post.date)}</time>
              <span aria-hidden>·</span>
              <span>{post.readingMinutes} min read</span>
              <span aria-hidden>·</span>
              <ul className="flex flex-wrap gap-x-2">
                {post.tags.map((tag) => (
                  <li key={tag} className="font-mono text-xs">
                    {tag}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <span
            className="hidden items-center self-center text-fg-subtle transition-all duration-500 ease-out-expo group-hover:translate-x-1 group-hover:text-fg md:flex"
            aria-hidden
          >
            <ArrowRight className="size-5" />
          </span>
        </div>
      </Link>
    </article>
  );
}
