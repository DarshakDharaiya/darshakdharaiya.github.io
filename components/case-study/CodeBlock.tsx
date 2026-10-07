import type { CodeSnippet } from "@/data/types";
import { highlight, type Token } from "@/lib/highlight";

const color: Record<Token["type"], string> = {
  kw: "text-[#c678dd] dark:text-[#c792ea]",
  str: "text-[#3d8b40] dark:text-[#a5d6a7]",
  com: "text-fg-subtle italic",
  num: "text-[#d9822b] dark:text-[#f7b267]",
  ann: "text-[#d9822b] dark:text-[#f7b267]",
  fn: "text-[#2f6fd6] dark:text-[#82aaff]",
  type: "text-[#b5651d] dark:text-[#ffcb6b]",
  plain: "text-fg",
};

export function CodeBlock({ snippet }: { snippet: CodeSnippet }) {
  const lines = highlight(snippet.code);
  return (
    <figure className="glass overflow-hidden rounded-glass">
      <figcaption className="flex items-center justify-between border-b border-line px-5 py-3">
        <span className="flex items-center gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
        </span>
        <span className="text-sm text-fg-muted">{snippet.title}</span>
        <span className="font-mono text-xs uppercase text-fg-subtle">{snippet.language}</span>
      </figcaption>
      <pre className="overflow-x-auto p-5 text-[13px] leading-[1.7] md:p-6 md:text-sm" tabIndex={0} data-lenis-prevent>
        <code className="font-mono">
          {lines.map((tokens, i) => (
            <span key={i} className="table-row">
              <span className="table-cell select-none pr-5 text-right text-fg-subtle/60" aria-hidden>
                {i + 1}
              </span>
              <span className="table-cell whitespace-pre">
                {tokens.map((t, j) => (
                  <span key={j} className={color[t.type]}>
                    {t.text}
                  </span>
                ))}
              </span>
            </span>
          ))}
        </code>
      </pre>
    </figure>
  );
}
