"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Magnetic } from "./Magnetic";
import { ArrowDown, ArrowRight, ArrowUpRight } from "./Icons";
import { cn } from "@/lib/utils";

type Variant = "primary" | "glass" | "ghost";
type Size = "md" | "lg" | "xl";
type ArrowKind = "right" | "up-right" | "down" | "none";

type Common = {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  arrow?: ArrowKind;
  magnetic?: boolean;
  className?: string;
};

type AsLink = Common & {
  href: string;
  external?: boolean;
  download?: boolean | string;
  /** View-transition types for internal navigations */
  transitionTypes?: string[];
} & Omit<
    ComponentProps<"a">,
    "href" | "children" | "className"
  >;
type AsButton = Common & { href?: undefined } & Omit<ComponentProps<"button">, "children" | "className">;

const base =
  "group/btn relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-pill font-medium tracking-[-0.01em] " +
  "transition-[padding,background-color,box-shadow,transform] duration-500 ease-out-expo active:scale-[0.97] " +
  "focus-visible:outline-offset-4 select-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-fg text-bg shadow-soft-md hover:shadow-soft-lg active:shadow-[inset_0_2px_6px_rgb(0_0_0/0.35)]",
  glass: "glass text-fg hover:bg-[var(--glass-bg-strong)] active:shadow-[inset_0_2px_6px_rgb(0_0_0/0.12)]",
  ghost: "text-fg hover:bg-accent-soft",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-5 text-[15px] hover:px-6",
  lg: "h-14 px-7 text-base hover:px-8",
  xl: "h-20 px-10 text-lg md:h-24 md:px-14 md:text-xl hover:md:px-16",
};

/** Arrow that slides out and a twin that slides in — reads as "forward motion" */
function AnimatedArrow({ kind }: { kind: ArrowKind }) {
  if (kind === "none") return null;
  const Icon = kind === "right" ? ArrowRight : kind === "up-right" ? ArrowUpRight : ArrowDown;
  const out =
    kind === "right"
      ? "group-hover/btn:translate-x-[140%]"
      : kind === "up-right"
        ? "group-hover/btn:translate-x-[140%] group-hover/btn:-translate-y-[140%]"
        : "group-hover/btn:translate-y-[140%]";
  const inn =
    kind === "right"
      ? "-translate-x-[140%] group-hover/btn:translate-x-0"
      : kind === "up-right"
        ? "-translate-x-[140%] translate-y-[140%] group-hover/btn:translate-x-0 group-hover/btn:translate-y-0"
        : "-translate-y-[140%] group-hover/btn:translate-y-0";
  return (
    <span className="relative inline-flex size-[1.1em] overflow-hidden" aria-hidden>
      <Icon className={cn("absolute inset-0 size-full transition-transform duration-500 ease-out-expo", out)} />
      <Icon className={cn("absolute inset-0 size-full transition-transform duration-500 ease-out-expo", inn)} />
    </span>
  );
}

export function Button(props: AsLink | AsButton) {
  const { children, variant = "primary", size = "lg", arrow = "none", magnetic = true, className, ...rest } = props;
  const cls = cn(base, variants[variant], sizes[size], className);
  const content = (
    <>
      <span className="relative">{children}</span>
      <AnimatedArrow kind={arrow} />
    </>
  );

  let el: ReactNode;
  if ("href" in props && props.href) {
    const { href, external, download, transitionTypes, ...anchor } = rest as AsLink;
    const isExternal = external || /^(https?:|mailto:|tel:)/.test(href) || download;
    el = isExternal ? (
      <a
        href={href}
        className={cls}
        download={download}
        {...(external || /^https?:/.test(href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...anchor}
      >
        {content}
      </a>
    ) : (
      <Link href={href} className={cls} transitionTypes={transitionTypes} {...anchor}>
        {content}
      </Link>
    );
  } else {
    el = (
      <button type="button" className={cls} {...(rest as Omit<AsButton, keyof Common>)}>
        {content}
      </button>
    );
  }

  return magnetic ? <Magnetic strength={size === "xl" ? 0.22 : 0.32}>{el}</Magnetic> : el;
}
