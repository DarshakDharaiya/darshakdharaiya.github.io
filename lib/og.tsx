import type { ReactElement } from "react";
import { site } from "@/data/site";
import { achievements } from "@/data/stats";

/**
 * Shared artwork for every generated link preview.
 *
 * Satori (which backs ImageResponse) supports a deliberately small subset of CSS:
 * flexbox only, no CSS variables, no shorthand that needs the cascade. So the site's
 * design tokens are restated here as literals rather than imported — the two must be
 * kept in step by hand, which is why there are so few of them.
 */
export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

const BG = "#060709";
const FG = "#f5f5f7";
const MUTED = "#9a9aa1";
const SUBTLE = "#5f5f66";
const ACCENT = "#8b95ff";

const fmt = (n: number, decimals: number, suffix: string) => `${n.toFixed(decimals)}${suffix}`;

/** The three hardest numbers on the site, in the order they land hardest. */
export function ogStats(): { value: string; label: string }[] {
  const [installs, millionPlus, topRating] = achievements;
  return [
    { value: fmt(installs.value, installs.decimals, installs.suffix), label: "installs on Google Play" },
    { value: fmt(millionPlus.value, millionPlus.decimals, millionPlus.suffix), label: "apps past one million" },
    // No star glyph: Satori has no font for it and tries to fetch one at build
    // time, which both fails and makes the build depend on the network.
    { value: fmt(topRating.value, topRating.decimals, ""), label: "top store rating" },
  ];
}

const domain = site.url.replace(/^https?:\/\//, "").replace(/\/$/, "");

/**
 * One card for every surface. `eyebrow` and `title` change per route; the proof
 * strip along the bottom never does, because it is the point of the whole image.
 */
export function OgCard({
  eyebrow,
  title,
  kicker,
}: {
  eyebrow: string;
  title: string;
  /** Optional line under the title — the role on the home card, tags on a post */
  kicker?: string;
}): ReactElement {
  const stats = ogStats();

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: BG,
        // Satori supports radial-gradient; this is the ambient pool the site uses.
        backgroundImage: `radial-gradient(900px 600px at 12% -10%, rgba(139,149,255,0.22), transparent 60%), radial-gradient(700px 500px at 108% 112%, rgba(139,149,255,0.12), transparent 60%)`,
        padding: 72,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", width: 34, height: 2, backgroundColor: ACCENT }} />
          <div
            style={{
              marginLeft: 18,
              fontSize: 22,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: MUTED,
            }}
          >
            {eyebrow}
          </div>
        </div>

        <div
          style={{
            marginTop: 34,
            fontSize: title.length > 52 ? 62 : 78,
            lineHeight: 1.08,
            letterSpacing: -2.5,
            color: FG,
            // Satori has no line clamping; the font-size step above is the guard.
            display: "flex",
          }}
        >
          {title}
        </div>

        {kicker && (
          <div style={{ marginTop: 26, fontSize: 30, color: MUTED, display: "flex" }}>{kicker}</div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", width: "100%", height: 1, backgroundColor: "rgba(255,255,255,0.1)" }} />
        <div
          style={{
            marginTop: 30,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex" }}>
            {stats.map((s, i) => (
              <div
                key={s.label}
                style={{ display: "flex", flexDirection: "column", marginLeft: i === 0 ? 0 : 56 }}
              >
                <div style={{ fontSize: 46, color: FG, letterSpacing: -1.5, display: "flex" }}>
                  {s.value}
                </div>
                <div style={{ marginTop: 6, fontSize: 20, color: SUBTLE, display: "flex" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            {/* On the home card the title is already the name; repeating it reads as a bug. */}
            {title !== site.name && (
              <div style={{ fontSize: 26, color: FG, display: "flex" }}>{site.name}</div>
            )}
            <div style={{ marginTop: 6, fontSize: 20, color: SUBTLE, display: "flex" }}>{domain}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
