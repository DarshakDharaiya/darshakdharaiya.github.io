import Script from "next/script";

/**
 * Optional, cookieless analytics.
 *
 * Deliberately provider-agnostic and off by default: choosing who gets your
 * visitors' data is not a decision to inherit from a template, and a site that
 * ships a tracker nobody asked for is a site that needs a consent banner.
 *
 * Set both variables at build time and the script is included; leave either unset
 * and nothing is emitted at all. The variables are read at build time because the
 * site is a static export — there is no server to read them later.
 *
 *   NEXT_PUBLIC_ANALYTICS_SRC    the provider's script URL
 *   NEXT_PUBLIC_ANALYTICS_SITE   your site id / domain with that provider
 *
 * Known-good, cookieless, GDPR-friendly options (no consent banner required):
 *
 *   GoatCounter  SRC=https://gc.zgo.at/count.js             SITE=<code>.goatcounter.com
 *   Plausible    SRC=https://plausible.io/js/script.js      SITE=darshakdharaiya.github.io
 *   Umami        SRC=https://<your-umami>/script.js         SITE=<website-id>
 *
 * The attributes below cover all three: each provider ignores the ones it does
 * not recognise.
 */
export function Analytics() {
  const src = process.env.NEXT_PUBLIC_ANALYTICS_SRC;
  const siteId = process.env.NEXT_PUBLIC_ANALYTICS_SITE;
  if (!src || !siteId) return null;

  return (
    <Script
      src={src}
      strategy="afterInteractive"
      data-domain={siteId}
      data-website-id={siteId}
      data-goatcounter={siteId.includes("goatcounter") ? `https://${siteId}/count` : undefined}
    />
  );
}
