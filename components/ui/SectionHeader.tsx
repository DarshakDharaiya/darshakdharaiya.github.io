import { TextReveal } from "@/components/animations/TextReveal";
import { Reveal } from "@/components/animations/Reveal";
import { cn } from "@/lib/utils";

/** Consistent section opener: index · eyebrow, then a large revealed title. */
export function SectionHeader({
  index,
  eyebrow,
  title,
  lead,
  className,
  align = "left",
}: {
  index: string;
  eyebrow: string;
  title: string | string[];
  lead?: string;
  className?: string;
  align?: "left" | "center";
}) {
  return (
    <header className={cn("mb-16 md:mb-24", align === "center" && "text-center", className)}>
      <Reveal>
        <p className={cn("eyebrow flex items-center gap-3", align === "center" && "justify-center")}>
          <span className="text-fg">{index}</span>
          <span className="h-px w-8 bg-line-strong" aria-hidden />
          {eyebrow}
        </p>
      </Reveal>
      <TextReveal as="h2" text={title} by="words" className="mt-6 text-h2 font-semibold text-balance" />
      {lead && (
        <Reveal index={2}>
          <p className={cn("mt-6 max-w-xl text-lead text-fg-muted", align === "center" && "mx-auto")}>{lead}</p>
        </Reveal>
      )}
    </header>
  );
}
