import Image from "next/image";
import type { ReactNode } from "react";
import { avatar } from "@/data/avatar";

/** Small round Memoji for the nav; falls back to the monogram when none is set. */
export function MemojiBadge({ fallback }: { fallback: ReactNode }) {
  if (!avatar.badge.src) return <>{fallback}</>;
  return (
    <span className="relative block size-full overflow-hidden rounded-full">
      <Image src={avatar.badge.src} alt="" fill sizes="48px" className="object-contain" />
    </span>
  );
}
