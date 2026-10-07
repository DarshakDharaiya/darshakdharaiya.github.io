import Image from "next/image";
import type { Project } from "@/data/types";
import { cn } from "@/lib/utils";

/**
 * Three phone screens fanned on a frosted stage, lit by the project's accent.
 * Pure CSS transforms — hover state is driven by the parent `group/stage`.
 */
export function PhoneStage({
  project,
  priority = false,
  className,
  sizes = "(min-width: 1024px) 22vw, 45vw",
}: {
  project: Project;
  priority?: boolean;
  className?: string;
  sizes?: string;
}) {
  const shots = project.screenshots.filter((s) => s.height > s.width).slice(0, 3);
  const [center, left, right] = [shots[0], shots[1] ?? shots[0], shots[2] ?? shots[0]];

  return (
    <div
      className={cn(
        "relative isolate aspect-[4/3.4] w-full overflow-hidden rounded-card border border-line bg-bg-elevated/60 shadow-soft-lg",
        className,
      )}
      style={{ ["--accent-stage" as string]: project.accent }}
    >
      {/* Accent light pooled behind the devices */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-60 transition-opacity duration-700 group-hover/stage:opacity-100"
        style={{
          background:
            "radial-gradient(60% 55% at 50% 60%, color-mix(in oklab, var(--accent-stage) 38%, transparent), transparent 70%)",
        }}
      />
      {/* Floor reflection line */}
      <div aria-hidden className="absolute inset-x-[12%] bottom-[11%] -z-10 h-px bg-gradient-to-r from-transparent via-line-strong to-transparent" />

      <div className="absolute inset-0 flex items-center justify-center [perspective:1400px]">
        <Phone
          shot={left}
          className="-translate-x-[62%] translate-y-[4%] -rotate-[9deg] scale-[0.84] opacity-90 group-hover/stage:-translate-x-[72%] group-hover/stage:-rotate-[12deg]"
          sizes={sizes}
        />
        <Phone
          shot={right}
          className="translate-x-[62%] translate-y-[4%] rotate-[9deg] scale-[0.84] opacity-90 group-hover/stage:translate-x-[72%] group-hover/stage:rotate-[12deg]"
          sizes={sizes}
        />
        <Phone
          shot={center}
          className="z-10 group-hover/stage:-translate-y-[3%] group-hover/stage:scale-[1.04]"
          sizes={sizes}
          priority={priority}
        />
      </div>
    </div>
  );
}

function Phone({
  shot,
  className,
  sizes,
  priority,
}: {
  shot: Project["screenshots"][number];
  className?: string;
  sizes: string;
  priority?: boolean;
}) {
  return (
    <div
      className={cn(
        "absolute w-[34%] overflow-hidden rounded-[1.6rem] bg-black p-[1.6%] shadow-[0_30px_60px_-20px_rgb(0_0_0/0.45),0_0_0_1px_rgb(255_255_255/0.08)]",
        "transition-transform duration-[900ms] ease-out-expo",
        className,
      )}
    >
      <div className="relative overflow-hidden rounded-[1.35rem]" style={{ aspectRatio: `${shot.width} / ${shot.height}` }}>
        <Image src={shot.src} alt={shot.alt} fill sizes={sizes} priority={priority} className="object-cover" />
      </div>
    </div>
  );
}
