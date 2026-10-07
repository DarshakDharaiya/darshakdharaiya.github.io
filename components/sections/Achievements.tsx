import { achievements } from "@/data/stats";
import { Counter } from "@/components/animations/Counter";
import { Reveal } from "@/components/animations/Reveal";
import { Parallax } from "@/components/animations/Parallax";

export function Achievements() {
  return (
    <section aria-labelledby="achievements-title" data-mood="work" className="container-x py-section">
      <Reveal>
        <h2 id="achievements-title" className="eyebrow text-center">
          By the numbers — live on Google Play
        </h2>
      </Reveal>
      <dl className="mt-16 grid gap-y-16 sm:grid-cols-2 lg:grid-cols-4">
        {achievements.map((a, i) => (
          <Parallax key={a.label} speed={i % 2 ? 40 : 10}>
            <Reveal index={i} className="flex flex-col-reverse items-center text-center lg:border-l lg:border-line lg:first:border-l-0">
              <dt className="mt-3 max-w-[14rem] text-[15px] text-fg-muted">{a.label}</dt>
              <dd className="text-[clamp(3.5rem,2rem+5vw,7.5rem)] leading-none font-semibold tracking-[-0.06em]">
                <Counter value={a.value} decimals={a.decimals} suffix={a.suffix} />
              </dd>
            </Reveal>
          </Parallax>
        ))}
      </dl>
    </section>
  );
}
