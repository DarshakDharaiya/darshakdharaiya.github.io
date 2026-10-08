import { ImageResponse } from "next/og";
import { site } from "@/data/site";
import { OgCard, ogSize } from "@/lib/og";

/**
 * /og.png — the link preview, generated at build time from site data.
 *
 * This is a route handler rather than the `opengraph-image` file convention on
 * purpose. That convention emits an extensionless file, which GitHub Pages serves
 * as application/octet-stream — and every crawler that matters rejects a preview
 * whose Content-Type is not an image. A dotted route segment (the same trick
 * /resume.pdf uses) gives a real .png on disk, served as image/png.
 */
export const dynamic = "force-static";

export function GET() {
  return new ImageResponse(
    <OgCard eyebrow="Portfolio" title={site.name} kicker={`${site.roles[0]} · ${site.roles[1]}`} />,
    ogSize,
  );
}
