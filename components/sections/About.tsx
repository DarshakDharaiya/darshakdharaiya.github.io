import { about } from "@/data/site";
import { ScrollHighlight } from "@/components/animations/ScrollHighlight";
import { Reveal } from "@/components/animations/Reveal";
import { Counter } from "@/components/animations/Counter";

export function About() {
  return (
    <section id="about" data-mood="calm" aria-labelledby="about-title" className="container-x py-section">
      <Reveal>
        <p className="eyebrow flex items-center gap-3">
          <span className="text-fg">02</span>
          <span className="h-px w-8 bg-line-strong" aria-hidden />
          About
        </p>
      </Reveal>

      <div className="mt-10 grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-12">
        <h2 id="about-title" className="text-h1 font-semibold lg:col-span-7">
          <ScrollHighlight text="I care about the *details* people feel but rarely notice." />
        </h2>

        <div className="space-y-6 text-lead text-fg-muted lg:col-span-4 lg:col-start-9 lg:pt-4">
          {about.bio.map((p, i) => (
            <Reveal key={i} index={i}>
              <p>{p}</p>
            </Reveal>
          ))}
        </div>
      </div>

      <dl className="mt-24 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line md:mt-32 lg:grid-cols-4">
        {about.metrics.map((m, i) => (
          <Reveal key={m.label} index={i} className="bg-bg/80 p-6 backdrop-blur-xl md:p-10">
            <dt className="sr-only">{m.label}</dt>
            <dd className="text-h2 font-semibold">
              <Counter value={m.value} suffix={m.suffix} />
            </dd>
            <dd className="mt-2 text-sm text-fg-muted md:text-base" aria-hidden>
              {m.label}
            </dd>
          </Reveal>
        ))}
      </dl>
    </section>
  );
}
