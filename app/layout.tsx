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

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.roles[0]}`, template: `%s — ${site.name}` },
  description,
  keywords: [...site.keywords],
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: site.url,
    siteName: site.name,
    title: `${site.name} — ${site.roles[0]}`,
    description,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: site.name, description },
  robots: { index: true, follow: true },
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

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.name,
  url: site.url,
  jobTitle: site.roles[0],
  email: `mailto:${site.email}`,
  sameAs: socials.filter((s) => s.id !== "email").map((s) => s.href),
  knowsAbout: ["Android", "Kotlin", "Jetpack Compose", "Software Architecture", "Three.js", "React"],
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
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
      </body>
    </html>
  );
}
