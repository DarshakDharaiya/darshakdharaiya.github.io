import { ViewTransition, type ReactNode } from "react";

/**
 * Route-level transition: the outgoing page recedes (scale back + blur), the next one emerges.
 * Must wrap content inside each page.tsx (layouts persist, so enter/exit never fire there).
 * Animations live in globals.css under `.page-forward` / `.page-back`.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      enter={{ "page-forward": "page-forward", "page-back": "page-back", default: "none" }}
      exit={{ "page-forward": "page-forward", "page-back": "page-back", default: "none" }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
