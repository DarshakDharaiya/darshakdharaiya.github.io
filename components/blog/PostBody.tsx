import type { PostBlock } from "@/data/types";
import { CodeBlock } from "@/components/case-study/CodeBlock";
import { Reveal } from "@/components/animations/Reveal";
import { cn } from "@/lib/utils";

/** Heading ids let ChapterNav and in-page links target sections. */
export const headingId = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const noteTone = {
  tip: "border-accent/30 bg-accent-soft",
  warn: "border-[#d9822b]/30 bg-[#d9822b]/8 dark:bg-[#f7b267]/8",
} as const;

const noteLabel = { tip: "Worth knowing", warn: "Watch out" } as const;

function Block({ block }: { block: PostBlock }) {
  switch (block.type) {
    case "h2":
      return (
        <h2 id={headingId(block.text)} className="mt-16 scroll-mt-32 text-h3 font-semibold text-balance md:mt-20">
          {block.text}
        </h2>
      );

    case "h3":
      return (
        <h3 id={headingId(block.text)} className="mt-12 scroll-mt-32 text-lead font-semibold">
          {block.text}
        </h3>
      );

    case "p":
      return <p className="mt-6 text-lead text-fg-muted">{block.text}</p>;

    case "list": {
      const List = block.ordered ? "ol" : "ul";
      return (
        <List className={cn("mt-7 space-y-3.5 text-lead text-fg-muted", block.ordered && "[counter-reset:step]")}>
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-4">
              <span className="mt-[0.6em] shrink-0 font-mono text-xs text-fg-subtle" aria-hidden>
                {block.ordered ? `${i + 1}.` : "—"}
              </span>
              <span className="min-w-0">{item}</span>
            </li>
          ))}
        </List>
      );
    }

    case "code":
      return (
        <div className="mt-9">
          <CodeBlock snippet={block.snippet} />
        </div>
      );

    case "note":
      return (
        <aside className={cn("mt-9 rounded-glass border px-6 py-5 md:px-7", noteTone[block.tone])}>
          <p className="eyebrow text-fg">{noteLabel[block.tone]}</p>
          <p className="mt-3 font-semibold text-fg">{block.title}</p>
          <p className="mt-2 text-fg-muted">{block.text}</p>
        </aside>
      );

    case "table":
      return (
        <figure className="mt-9">
          {/* Tables are the one block that can overflow on a phone; let it scroll
              itself rather than forcing the page wider. */}
          <div className="overflow-x-auto [scrollbar-width:thin]" tabIndex={0} data-lenis-prevent>
            <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line-strong">
                  {block.head.map((cell) => (
                    <th key={cell} scope="col" className="py-3 pr-6 font-semibold text-fg">
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, i) => (
                  <tr key={i} className="border-b border-line">
                    {row.map((cell, j) => (
                      <td key={j} className={cn("py-3.5 pr-6 align-top", j === 0 ? "text-fg" : "text-fg-muted")}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {block.caption && (
            <figcaption className="mt-3 text-sm text-fg-subtle">{block.caption}</figcaption>
          )}
        </figure>
      );
  }
}

export function PostBody({ blocks }: { blocks: PostBlock[] }) {
  return (
    <div>
      {blocks.map((block, i) => (
        // Reveal per block keeps the long read feeling alive without animating
        // each one from a different offset.
        <Reveal key={i} index={i % 3}>
          <Block block={block} />
        </Reveal>
      ))}
    </div>
  );
}
