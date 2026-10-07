import type { ReactNode } from "react";
import { resume } from "@/data/resume";
import { site } from "@/data/site";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { TiltCard } from "@/components/ui/TiltCard";
import { Reveal } from "@/components/animations/Reveal";

const INK = "text-[#1d1d1f]";
const BODY = "text-[#3a3a3c]";
const MUTED = "text-[#6e6e73]";

/**
 * Résumé preview rendered as a physical sheet of paper (always light, like the PDF it mirrors).
 * Same `resume` object generates /resume.pdf — one source of truth.
 */
export function Resume() {
  const contact = [resume.contact.email, resume.contact.phone, resume.contact.location, resume.contact.linkedin].filter(Boolean);
  return (
    <section id="resume" data-mood="calm" aria-labelledby="resume-title" className="container-x py-section">
      <div className="grid grid-cols-1 items-start gap-16 lg:grid-cols-12">
        <div className="lg:sticky lg:top-32 lg:col-span-5">
          <SectionHeader
            index="05"
            eyebrow="Résumé"
            title={["The short", "version."]}
            lead="Senior Android Developer & Team Lead — 3+ years shipping production apps to millions on Google Play."
            className="mb-10 md:mb-12"
          />
          <Reveal>
            <ul className="mb-10 grid grid-cols-2 gap-3">
              {resume.highlights.map((h) => (
                <li key={h} className="rounded-glass border border-line p-4 text-sm text-fg-muted">
                  {h}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal className="flex flex-wrap gap-3">
            <Button href={site.resumePath} download="Darshak-Dharaiya-Resume.pdf" arrow="down">
              Download résumé
            </Button>
            <Button href={site.resumePath} external variant="glass" arrow="up-right" magnetic={false}>
              Open PDF
            </Button>
          </Reveal>
        </div>

        <Reveal className="lg:col-span-7">
          <TiltCard max={3} className="rounded-[1.25rem]">
            <article
              aria-label="Résumé preview"
              className={`relative overflow-hidden rounded-[1.25rem] bg-[#fdfcfa] p-7 ${INK} shadow-[0_2px_4px_rgb(0_0_0/0.04),0_40px_100px_-30px_rgb(0_0_0/0.45)] ring-1 ring-black/5 sm:p-10 md:p-12`}
            >
              <header className="border-b border-black/10 pb-6 text-center">
                <h3 className="text-3xl font-semibold tracking-[-0.03em]">{resume.name}</h3>
                <p className="mt-1 text-[15px] font-medium">{resume.title}</p>
                <p className={`text-[13px] ${MUTED}`}>{resume.headline}</p>
                <p className={`mt-3 text-[12.5px] ${MUTED}`}>{contact.join("  ·  ")}</p>
              </header>

              <Block title="Professional summary">
                <p className={`text-[14px] leading-relaxed ${BODY}`}>{resume.summary}</p>
              </Block>

              <Block title="Experience">
                <div className="space-y-6">
                  {resume.experience.map((e) => (
                    <div key={e.company}>
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-[15px] font-semibold">
                          {e.company}
                          {e.formerly && <span className={`font-normal ${MUTED}`}> (formerly {e.formerly})</span>}
                        </p>
                        <p className={`text-[12px] ${MUTED}`}>{e.location}</p>
                      </div>
                      <p className="mt-0.5 flex flex-wrap justify-between gap-2 text-[13.5px] italic">
                        <span className="font-medium">{e.role}</span>
                        <span className={MUTED}>
                          {e.start} — {e.end}
                        </span>
                      </p>
                      {e.earlierRoles?.map((r) => (
                        <p key={r.role} className="flex flex-wrap justify-between gap-2 text-[13.5px] italic">
                          <span className="font-medium">{r.role}</span>
                          <span className={MUTED}>
                            {r.start} — {r.end}
                          </span>
                        </p>
                      ))}
                      <ul className={`mt-2 space-y-1 text-[13px] leading-relaxed ${BODY}`}>
                        {[...e.responsibilities.slice(0, 2), ...e.achievements].map((a) => (
                          <li key={a} className="flex gap-2">
                            <span aria-hidden>•</span>
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </Block>

              <Block title="Key projects">
                <ul className="space-y-3">
                  {resume.projects.map((p) => (
                    <li key={p.title}>
                      <p className="text-[14px] font-semibold">
                        {p.title}
                        {p.meta && <span className={`font-normal ${MUTED}`}> — {p.meta}</span>}
                      </p>
                      <p className={`text-[13px] leading-relaxed ${BODY}`}>{p.line}</p>
                    </li>
                  ))}
                </ul>
              </Block>

              <Block title="Key skills">
                <ul className={`space-y-1.5 text-[13px] leading-relaxed ${BODY}`}>
                  {resume.skills.map((s) => (
                    <li key={s.group}>
                      <span className={`font-semibold ${INK}`}>{s.group}:</span> {s.items.join(", ")}
                    </li>
                  ))}
                </ul>
              </Block>

              <div className="grid gap-x-8 sm:grid-cols-2">
                <Block title="Education">
                  {resume.education.map((e) => (
                    <div key={e.school} className="text-[13.5px]">
                      <p className="font-semibold">{e.degree}</p>
                      <p className={MUTED}>
                        {e.school}, {e.place} · {e.period}
                      </p>
                      <p className={`mt-1 text-[12.5px] ${BODY}`}>{e.detail}</p>
                    </div>
                  ))}
                </Block>
                <Block title="Languages">
                  <p className={`text-[13px] ${BODY}`}>{resume.languages.join(", ")}</p>
                </Block>
              </div>
            </article>
          </TiltCard>
        </Reveal>
      </div>
    </section>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-7">
      <h4 className="mb-3 border-b border-black/10 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1d1d1f]">
        {title}
      </h4>
      {children}
    </section>
  );
}
