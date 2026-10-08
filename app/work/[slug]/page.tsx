import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition, type ReactNode } from "react";
import { featuredProjects, getProject } from "@/data/projects";
import { site } from "@/data/site";
import { PageTransition } from "@/components/layout/PageTransition";
import { PhoneStage } from "@/components/sections/work/PhoneStage";
import { ChapterNav } from "@/components/case-study/ChapterNav";
import { CodeBlock } from "@/components/case-study/CodeBlock";
import { ArchitectureDiagram } from "@/components/case-study/ArchitectureDiagram";
import { TextReveal } from "@/components/animations/TextReveal";
import { Reveal } from "@/components/animations/Reveal";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, StarIcon } from "@/components/ui/Icons";
import { pad2 } from "@/lib/utils";

export const dynamicParams = false;

export function generateStaticParams() {
  return featuredProjects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const p = getProject(slug);
  if (!p) return {};
  return {
    title: `${p.title} — Case study`,
    description: p.description,
    alternates: { canonical: `/work/${p.slug}` },
    openGraph: {
      title: `${p.title} — ${site.name}`,
      description: p.description,
      // The generated 1.91:1 card, not a 720x1280 screenshot that crops to a sliver.
      images: [{ url: `/work/${p.slug}/og.png`, width: 1200, height: 630, type: "image/png" }],
    },
  };
}

const CHAPTERS = [
  "Overview",
  "Problem",
  "Research",
  "Challenges",
  "Solution",
  "Architecture",
  "UI / UX",
  "Technologies",
  "Results",
  "Learnings",
] as const;

export default async function CaseStudyPage(props: PageProps<"/work/[slug]">) {
  const { slug } = await props.params;
  const project = getProject(slug);
  if (!project?.caseStudy) notFound();
  const cs = project.caseStudy;
  const index = featuredProjects.findIndex((p) => p.slug === slug);
  const next = featuredProjects[(index + 1) % featuredProjects.length];
  const chapters = CHAPTERS.map((label, i) => ({ id: `ch-${pad2(i + 1)}`, label }));

  return (
    <PageTransition>
      <main id="main" className="pb-section">
        {/* ───────── Hero ───────── */}
        <header className="container-x pt-32 md:pt-40">
          <Link
            href="/#work"
            transitionTypes={["page-back"]}
            className="group inline-flex items-center gap-2 text-sm text-fg-muted transition-colors hover:text-fg"
          >
            <ArrowLeft className="size-4 transition-transform duration-500 ease-out-expo group-hover:-translate-x-1" />
            All work
          </Link>

          <div className="mt-12 grid grid-cols-1 items-end gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="flex items-center gap-4">
                <Image src={project.icon} alt="" width={64} height={64} priority className="size-16 rounded-[18px] shadow-soft-md" />
                <p className="eyebrow">
                  Case study · {pad2(index + 1)}
                </p>
              </div>
              <TextReveal as="h1" text={project.title} by="words" immediate className="mt-8 text-h1 font-semibold text-balance" />
              <Reveal index={2}>
                <p className="mt-6 max-w-2xl text-lead text-fg-muted">{project.tagline}</p>
              </Reveal>
            </div>
            <Reveal index={3} className="lg:col-span-5">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-6 text-sm">
                <div className="col-span-2">
                  <dt className="eyebrow">Role</dt>
                  <dd className="mt-1.5 text-fg">{project.role}</dd>
                </div>
                <div>
                  <dt className="eyebrow">Platform</dt>
                  <dd className="mt-1.5 text-fg">{project.platform}</dd>
                </div>
                <div>
                  <dt className="eyebrow">Google Play</dt>
                  <dd className="mt-1.5 flex items-center gap-1.5 text-fg">
                    {project.store.installs === "New" ? "Recently launched" : `${project.store.installs} installs`}
                    {project.store.rating && (
                      <>
                        <span className="text-fg-subtle">·</span>
                        <StarIcon className="size-3.5 text-accent" /> {project.store.rating}
                      </>
                    )}
                  </dd>
                </div>
                <div className="col-span-2">
                  <Button href={project.store.url} arrow="up-right" size="md">
                    View on Google Play
                  </Button>
                </div>
              </dl>
            </Reveal>
          </div>

          <div className="mt-16 md:mt-24">
            <ViewTransition name={`stage-${project.slug}`} share="morph" default="none">
              <PhoneStage project={project} priority className="aspect-[4/3] md:aspect-[16/8.5]" sizes="(min-width: 1024px) 26vw, 60vw" />
            </ViewTransition>
          </div>
        </header>

        {/* ───────── Body ───────── */}
        <div className="container-x mt-24 grid grid-cols-1 gap-12 md:mt-36 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            <ChapterNav chapters={chapters} />
          </aside>

          <article className="space-y-28 md:space-y-40 lg:col-span-8 lg:col-start-5">
            <Chapter id={chapters[0].id} n={1} title="Overview">
              <p className="text-h3 font-medium text-balance">{cs.overview}</p>
              {cs.video && (
                <video
                  className="mt-10 w-full rounded-card border border-line"
                  src={cs.video.src}
                  poster={cs.video.poster}
                  controls
                  playsInline
                  preload="none"
                />
              )}
              <Metrics metrics={cs.results.metrics} className="mt-12" />
            </Chapter>

            <Chapter id={chapters[1].id} n={2} title="Problem">
              <blockquote className="border-l-2 border-accent pl-6 text-lead text-fg md:pl-8 md:text-h3 md:font-medium">
                {cs.problem}
              </blockquote>
            </Chapter>

            <Chapter id={chapters[2].id} n={3} title="Research">
              <ol className="space-y-6">
                {cs.research.map((r, i) => (
                  <Reveal as="li" key={i} index={i} className="grid grid-cols-[2.5rem_1fr] gap-2 text-lead text-fg-muted">
                    <span className="font-mono text-sm leading-[2] text-fg-subtle">{pad2(i + 1)}</span>
                    <span>{r}</span>
                  </Reveal>
                ))}
              </ol>
            </Chapter>

            <Chapter id={chapters[3].id} n={4} title="Challenges">
              <div className="grid gap-4 md:grid-cols-2">
                {cs.challenges.map((c, i) => (
                  <Reveal key={c.title} index={i} className="glass rounded-glass p-6 md:p-8">
                    <h3 className="text-xl font-semibold tracking-[-0.02em]">{c.title}</h3>
                    <p className="mt-3 text-fg-muted">{c.body}</p>
                  </Reveal>
                ))}
              </div>
            </Chapter>

            <Chapter id={chapters[4].id} n={5} title="Solution">
              <p className="text-lead text-fg-muted">{cs.solution}</p>
              {cs.code && (
                <Reveal className="mt-10">
                  <CodeBlock snippet={cs.code} />
                </Reveal>
              )}
            </Chapter>

            <Chapter id={chapters[5].id} n={6} title="Architecture">
              <p className="mb-10 text-lead text-fg-muted">{cs.architecture.summary}</p>
              <ArchitectureDiagram layers={cs.architecture.layers} />
            </Chapter>

            <Chapter id={chapters[6].id} n={7} title="UI / UX">
              <p className="text-lead text-fg-muted">{cs.uiux.summary}</p>
              <ul className="mt-8 grid gap-3 md:grid-cols-3">
                {cs.uiux.principles.map((p, i) => (
                  <Reveal as="li" key={p} index={i} className="rounded-glass border border-line p-5 text-[15px]">
                    {p}
                  </Reveal>
                ))}
              </ul>
              <div
                className="-mx-[var(--spacing-gutter)] mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-[var(--spacing-gutter)] pb-4 [scrollbar-width:thin] lg:mx-0 lg:px-0"
                data-lenis-prevent
                tabIndex={0}
                aria-label="Screens"
              >
                {project.screenshots.map((s) => (
                  <figure key={s.src} className="w-[58%] shrink-0 snap-start sm:w-[34%] md:w-[30%]">
                    <div className="overflow-hidden rounded-[1.8rem] bg-black p-1.5 shadow-soft-lg">
                      <Image
                        src={s.src}
                        alt={s.alt}
                        width={s.width}
                        height={s.height}
                        sizes="(min-width: 768px) 20vw, 58vw"
                        className="h-auto w-full rounded-[1.5rem]"
                      />
                    </div>
                    <figcaption className="mt-3 text-center text-sm text-fg-muted">{s.alt}</figcaption>
                  </figure>
                ))}
              </div>
            </Chapter>

            <Chapter id={chapters[7].id} n={8} title="Technologies">
              <dl className="divide-y divide-line border-y border-line">
                {cs.technologies.map((t) => (
                  <div key={t.name} className="grid gap-1 py-5 md:grid-cols-[14rem_1fr] md:gap-6">
                    <dt className="font-medium text-fg">{t.name}</dt>
                    <dd className="text-fg-muted">{t.why}</dd>
                  </div>
                ))}
              </dl>
            </Chapter>

            <Chapter id={chapters[8].id} n={9} title="Results">
              <p className="text-lead text-fg-muted">{cs.results.summary}</p>
              <Metrics metrics={cs.results.metrics} className="mt-10" large />
              {cs.comparison && (
                <div className="mt-14">
                  <h3 className="eyebrow">Before / after — {cs.comparison.title}</h3>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <Reveal className="rounded-glass border border-dashed border-line-strong p-6 md:p-8">
                      <p className="font-mono text-xs uppercase tracking-[0.16em] text-fg-subtle">Before · {cs.comparison.before.label}</p>
                      <ul className="mt-4 space-y-2.5 text-fg-muted">
                        {cs.comparison.before.points.map((p) => (
                          <li key={p} className="flex gap-3">
                            <span aria-hidden className="text-fg-subtle">−</span>
                            {p}
                          </li>
                        ))}
                      </ul>
                    </Reveal>
                    <Reveal index={1} className="glass rounded-glass p-6 shadow-glow md:p-8">
                      <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">After · {cs.comparison.after.label}</p>
                      <ul className="mt-4 space-y-2.5 text-fg">
                        {cs.comparison.after.points.map((p) => (
                          <li key={p} className="flex gap-3">
                            <span aria-hidden className="text-accent">+</span>
                            {p}
                          </li>
                        ))}
                      </ul>
                    </Reveal>
                  </div>
                </div>
              )}
            </Chapter>

            <Chapter id={chapters[9].id} n={10} title="Learnings">
              <ul className="space-y-6">
                {cs.learnings.map((l, i) => (
                  <Reveal as="li" key={l} index={i} className="font-serif text-h3 italic text-fg">
                    “{l}”
                  </Reveal>
                ))}
              </ul>
            </Chapter>
          </article>
        </div>

        {/* ───────── Next project ───────── */}
        <nav aria-label="Next project" className="container-x mt-section">
          <Link
            href={`/work/${next.slug}`}
            transitionTypes={["page-forward"]}
            data-cursor="label"
            data-cursor-label="NEXT PROJECT →"
            className="group/stage block border-t border-line pt-12"
          >
            <p className="eyebrow">Next project</p>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-8">
              <p className="text-h1 font-semibold transition-transform duration-700 ease-out-expo group-hover/stage:translate-x-3">
                {next.shortTitle}
              </p>
              <Image src={next.icon} alt="" width={96} height={96} className="size-20 rounded-[22px] shadow-soft-lg transition-transform duration-700 ease-out-expo group-hover/stage:-rotate-6 group-hover/stage:scale-105 md:size-24" />
            </div>
          </Link>
        </nav>
      </main>
    </PageTransition>
  );
}

function Chapter({ id, n, title, children }: { id: string; n: number; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-t`} className="scroll-mt-32">
      <Reveal>
        <h2 id={`${id}-t`} className="mb-8 flex items-baseline gap-4">
          <span className="font-mono text-sm text-fg-subtle">{pad2(n)}</span>
          <span className="text-h2 font-semibold">{title}</span>
        </h2>
      </Reveal>
      {children}
    </section>
  );
}

function Metrics({
  metrics,
  className,
  large,
}: {
  metrics: { value: string; label: string }[];
  className?: string;
  large?: boolean;
}) {
  return (
    <dl className={`grid grid-cols-2 gap-px overflow-hidden rounded-glass border border-line bg-line md:grid-cols-4 ${className ?? ""}`}>
      {metrics.map((m, i) => (
        <Reveal key={m.label} index={i} className="flex flex-col-reverse bg-bg/85 p-5 backdrop-blur-xl md:p-6">
          <dt className="mt-1 text-sm text-fg-muted">{m.label}</dt>
          <dd className={large ? "text-h2 font-semibold" : "text-h3 font-semibold"}>{m.value}</dd>
        </Reveal>
      ))}
    </dl>
  );
}
