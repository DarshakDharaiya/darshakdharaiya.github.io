import Image from "next/image";
import type { ReactNode } from "react";
import { avatar } from "@/data/avatar";

/**
 * Small round Memoji for the nav; falls back to the monogram when none is set.
 * It sits above the fold on every route and is frequently the LCP element, so it
 * is preloaded rather than lazily fetched.
 */
export function MemojiBadge({ fallback }: { fallback: ReactNode }) {
  if (!avatar.badge.src) return <>{fallback}</>;
  return (
    <span className="relative block size-full overflow-hidden rounded-full">
      <Image src={avatar.badge.src} alt="" fill priority sizes="48px" className="object-contain" />
    </span>
  );
}
