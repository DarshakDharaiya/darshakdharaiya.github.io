"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { motion, useScroll, useTransform } from "motion/react";
import { TextReveal } from "@/components/animations/TextReveal";
import { Button } from "@/components/ui/Button";
import { Magnetic } from "@/components/ui/Magnetic";
import { SocialIcon } from "@/components/ui/Icons";
import { useLenis } from "@/components/layout/SmoothScroll";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { site } from "@/data/site";
import { heroProof } from "@/data/stats";
import { socials } from "@/data/social";
import { ease } from "@/lib/animation";

const MemojiStage = dynamic(() => import("@/components/sections/MemojiStage"), { ssr: false });

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 24, filter: "blur(8px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 1.2, ease: ease.outExpo, delay },
});

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const lenis = useLenis();
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  // Content recedes as the camera flies forward past the D
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const blur = useTransform(scrollYProgress, [0, 0.7], ["blur(0px)", "blur(10px)"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);

  return (
    <section
      ref={ref}
      id="top"
      data-mood="hero"
      aria-labelledby="hero-title"
      className="relative flex min-h-svh flex-col"
    >
      <motion.div
        style={reduced ? undefined : { opacity, y, filter: blur, scale }}
        className="container-x flex flex-1 flex-col justify-center gap-12 pt-24 pb-28 md:pb-24 md:pt-32 lg:grid lg:grid-cols-12 lg:items-center lg:gap-8"
      >
        <MemojiStage className="max-w-[17rem] sm:max-w-xs lg:order-2 lg:col-span-5 lg:max-w-[34rem]" />
        <div className="max-w-[min(100%,52rem)] lg:order-1 lg:col-span-7">
          <motion.p {...fadeUp(0.15)} className="eyebrow flex items-center gap-3">
            <span className="relative flex size-2" aria-hidden>
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-accent" />
            </span>
            Hello, I&apos;m
          </motion.p>

          <h1 id="hero-title" className="mt-5 text-display font-semibold">
            <TextReveal text={site.firstName} immediate delay={0.25} className="block" />
            <TextReveal
              text={site.lastName}
              immediate
              delay={0.45}
              className="block font-serif font-normal italic tracking-[-0.03em] text-fg-muted"
            />
          </h1>

          <motion.p {...fadeUp(0.9)} className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-1 text-lead text-fg">
            {site.roles.map((role, i) => (
              <span key={role} className="flex items-center gap-3">
                {i > 0 && <span className="text-fg-subtle" aria-hidden>/</span>}
                {role}
              </span>
            ))}
          </motion.p>

          <motion.p {...fadeUp(1.05)} className="mt-5 max-w-xl text-lead text-fg-muted text-balance">
            {site.statement}
          </motion.p>

          {/* Proof before the ask. These are the numbers buried in Achievements,
              lifted above the fold where a recruiter skimming for a minute sees them. */}
          <motion.dl
            {...fadeUp(1.15)}
            className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4 sm:gap-x-10"
          >
            {heroProof.map((stat) => (
              <div key={stat.label} className="flex flex-col">
                <dd className="text-h3 font-semibold tracking-[-0.03em]">{stat.value}</dd>
                <dt className="mt-0.5 text-sm text-fg-muted">{stat.label}</dt>
              </div>
            ))}
          </motion.dl>

          <motion.div {...fadeUp(1.3)} className="mt-10 flex flex-wrap items-center gap-3">
            <Button
              href="/#work"
              arrow="right"
              onClick={(e) => {
                const target = document.getElementById("work");
                if (!target) return;
                e.preventDefault();
                if (lenis) lenis.scrollTo(target, { duration: 1.6 });
                else target.scrollIntoView({ behavior: "smooth" });
              }}
            >
              View my work
            </Button>
            <Button href={site.resumePath} download="Darshak-Dharaiya-Resume.pdf" variant="glass" arrow="down">
              Download résumé
            </Button>
          </motion.div>

          <motion.ul {...fadeUp(1.45)} className="mt-10 flex items-center gap-2" aria-label="Social links">
            {socials.map((s) => (
              <li key={s.id}>
                <Magnetic strength={0.4}>
                  <a
                    href={s.href}
                    target={s.id === "email" ? undefined : "_blank"}
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="glass grid size-11 place-items-center rounded-full text-fg-muted transition-colors hover:text-fg"
                  >
                    <SocialIcon id={s.id} className="size-[18px]" />
                  </a>
                </Magnetic>
              </li>
            ))}
          </motion.ul>
        </div>
      </motion.div>

      {/* Footer rail */}
      <motion.div
        {...fadeUp(1.6)}
        className="container-x absolute inset-x-0 bottom-6 hidden items-end justify-between md:flex"
      >
        <p className="eyebrow">
          {site.location} · {site.availability}
        </p>
        <div className="flex items-center gap-3 eyebrow" aria-hidden>
          Scroll to explore
          <span className="relative block h-10 w-px overflow-hidden bg-line-strong">
            <motion.span
              className="absolute inset-x-0 top-0 h-1/2 bg-fg"
              animate={reduced ? undefined : { y: ["-100%", "200%"] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: ease.inOutQuart }}
            />
          </span>
        </div>
      </motion.div>
    </section>
  );
}
