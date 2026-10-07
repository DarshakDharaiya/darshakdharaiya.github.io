"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { contact, site } from "@/data/site";
import { socials } from "@/data/social";
import { TextReveal } from "@/components/animations/TextReveal";
import { Reveal } from "@/components/animations/Reveal";
import { Button } from "@/components/ui/Button";
import { ArrowUpRight } from "@/components/ui/Icons";

function LocalTime() {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: site.timezone });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  return <span suppressHydrationWarning>{time ?? "—"}</span>;
}

export function Contact() {
  const [copied, setCopied] = useState(false);
  const linkedin = socials.find((s) => s.id === "linkedin");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(site.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <section
      id="contact"
      data-mood="contact"
      aria-labelledby="contact-title"
      className="container-x flex min-h-svh flex-col justify-center py-section text-center"
    >
      <Reveal>
        <p className="eyebrow">{contact.eyebrow}</p>
      </Reveal>
      <h2 id="contact-title" className="mx-auto mt-8 max-w-6xl text-display font-semibold">
        <TextReveal text={contact.heading[0]} className="block" />
        <TextReveal
          text={contact.heading[1]}
          delay={0.15}
          className="block font-serif font-normal italic tracking-[-0.03em] text-fg-muted"
        />
      </h2>

      <Reveal index={2} className="mt-14 flex justify-center md:mt-20">
        <Button href={`mailto:${site.email}`} size="xl" arrow="up-right">
          {contact.cta}
        </Button>
      </Reveal>

      <Reveal index={3}>
        <dl className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-x-6 gap-y-10 text-left md:mt-28 md:grid-cols-4">
          <div className="col-span-2 md:col-span-2">
            <dt className="eyebrow">Email</dt>
            <dd className="mt-2 flex items-center gap-3">
              <a href={`mailto:${site.email}`} className="link-underline text-lg break-all">
                {site.email}
              </a>
              <button
                type="button"
                onClick={copy}
                className="relative rounded-pill border border-line px-3 py-1 text-xs text-fg-muted transition-colors hover:text-fg"
                aria-label="Copy email address"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={copied ? "y" : "n"}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="block"
                  >
                    {copied ? "Copied" : "Copy"}
                  </motion.span>
                </AnimatePresence>
              </button>
            </dd>
          </div>
          {[linkedin].map(
            (s) =>
              s && (
                <div key={s.id}>
                  <dt className="eyebrow">{s.label}</dt>
                  <dd className="mt-2">
                    <a href={s.href} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1 text-lg">
                      <span className="link-underline">{s.handle}</span>
                      <ArrowUpRight className="size-4 text-fg-subtle transition-transform duration-500 ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  </dd>
                </div>
              ),
          )}
          <div>
            <dt className="eyebrow">Location</dt>
            <dd className="mt-2 text-lg">
              {site.location} · <LocalTime />
            </dd>
          </div>
          <div className="col-span-2 md:col-span-4">
            <dt className="sr-only">Availability</dt>
            <dd className="flex items-center justify-center gap-3 text-fg-muted">
              <span className="relative flex size-2" aria-hidden>
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              {site.availability}
            </dd>
          </div>
        </dl>
      </Reveal>
    </section>
  );
}
