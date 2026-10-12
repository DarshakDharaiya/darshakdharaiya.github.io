import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { site } from "@/data/site";
import { socials } from "@/data/social";
import { ThemeProvider, themeInitScript } from "@/components/layout/ThemeProvider";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CustomCursor } from "@/components/layout/CustomCursor";
import { SceneMoodObserver } from "@/components/layout/SceneMoodObserver";
import { Background } from "@/components/three/Background";
import { ResumeTab } from "@/components/layout/ResumeTab";
import { Analytics } from "@/components/layout/Analytics";
import { experience } from "@/data/experience";
import { avatar } from "@/data/avatar";
import { personId } from "@/lib/seo";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const description = `${site.name} — ${site.roles.join(" · ")}. ${site.statement}`;

/**
 * Generated at build time by app/og.png. Declared explicitly rather than through
 * the `opengraph-image` file convention, which emits an extensionless file that
 * GitHub Pages serves with the wrong Content-Type.
 */
const ogImage = {
  url: "/og.png",
  width: 1200,
  height: 630,
  type: "image/png",
  alt: `${site.name} — ${site.roles[0]}`,
};

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.roles[0]}`, template: `%s — ${site.name}` },
  description,
  keywords: [...site.keywords],
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  // No canonical or robots here: both would be inherited by the 404 page, which
  // then claimed to be the home page while Next also marked it noindex. The home
  // page sets its own canonical, and indexing is already the default.
  openGraph: {
    type: "website",
    url: site.url,
    siteName: site.name,
    title: `${site.name} — ${site.roles[0]}`,
    description,
    locale: "en_US",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.roles[0]}`,
    description,
    images: [ogImage],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f4f1" },
    { media: "(prefers-color-scheme: dark)", color: "#060709" },
  ],
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
};

const [city, country] = site.location.split(", ");

/**
 * One graph, on every page: the person and the site. Article and case-study pages
 * point their author at the same @id rather than repeating the details.
 */
const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": personId,
      name: site.name,
      givenName: site.firstName,
      familyName: site.lastName,
      url: site.url,
      image: `${site.url}${avatar.portrait.src}`,
      jobTitle: site.roles[0],
      description: site.statement,
      email: `mailto:${site.email}`,
      worksFor: { "@type": "Organization", name: experience[0].company },
      address: { "@type": "PostalAddress", addressLocality: city, addressCountry: country },
      sameAs: socials.filter((s) => s.id !== "email").map((s) => s.href),
      knowsAbout: [
        "Android",
        "Kotlin",
        "Jetpack Compose",
        "Clean Architecture",
        "MVI",
        "Coroutines",
        "Android performance",
        "Software Architecture",
        "Three.js",
        "React",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      url: site.url,
      name: site.name,
      description,
      inLanguage: "en",
      publisher: { "@id": personId },
    },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
      </head>
      <body className="grain min-h-dvh">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:rounded-pill focus:bg-fg focus:px-5 focus:py-3 focus:text-bg"
        >
          Skip to content
        </a>
        <ThemeProvider>
          <SmoothScroll>
            <Background />
            <Navbar />
            <ResumeTab />
            <div className="relative z-10">
              {children}
              <Footer />
            </div>
            <SceneMoodObserver />
            <CustomCursor />
          </SmoothScroll>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
