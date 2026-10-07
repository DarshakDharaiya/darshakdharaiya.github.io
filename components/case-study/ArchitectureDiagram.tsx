import type { ArchitectureLayer } from "@/data/types";
import { Reveal } from "@/components/animations/Reveal";

/**
 * Layered architecture diagram: stacked glass planes, top (UI) to bottom (platform),
 * with dependency arrows pointing downward — dependencies only flow one way.
 */
export function ArchitectureDiagram({ layers }: { layers: ArchitectureLayer[] }) {
  return (
    <figure aria-label="Architecture diagram" className="relative">
      <ol className="space-y-3">
        {layers.map((layer, i) => (
          <Reveal as="li" key={layer.name} index={i} className="relative">
            <div
              className="glass grid gap-4 rounded-glass p-5 md:grid-cols-[11rem_1fr] md:items-center md:p-6"
              style={{ marginInline: `${i * 1.2}%` }}
            >
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-subtle">Layer {i + 1}</p>
                <p className="mt-1 text-lg font-semibold tracking-[-0.02em]">{layer.name}</p>
                <p className="text-sm text-fg-muted">{layer.caption}</p>
              </div>
              <ul className="flex flex-wrap gap-1.5">
                {layer.items.map((item) => (
                  <li key={item} className="rounded-pill border border-line bg-bg/40 px-3 py-1.5 font-mono text-[12px] text-fg">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {i < layers.length - 1 && (
              <svg aria-hidden viewBox="0 0 12 18" className="absolute -bottom-[15px] left-1/2 z-10 h-[18px] w-3 -translate-x-1/2 text-fg-subtle">
                <path d="M6 0v14M2 10l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </Reveal>
        ))}
      </ol>
      <figcaption className="mt-4 text-center text-sm text-fg-subtle">Dependencies point downward only.</figcaption>
    </figure>
  );
}
