import type { Metadata } from "next";
import { PageTransition } from "@/components/layout/PageTransition";
import { Hero } from "@/components/sections/Hero";
import { Work } from "@/components/sections/work/Work";
import { About } from "@/components/sections/About";
import { Experience } from "@/components/sections/Experience";
import { Skills } from "@/components/sections/Skills";
import { Achievements } from "@/components/sections/Achievements";
import { Resume } from "@/components/sections/Resume";
import { Blog } from "@/components/sections/Blog";
import { Contact } from "@/components/sections/Contact";
import { site } from "@/data/site";
import { absoluteUrl, personId } from "@/lib/seo";

export const metadata: Metadata = {
  alternates: { canonical: absoluteUrl("/") },
};

/** Marks the home page as the profile of the Person declared in the root layout. */
const profileJsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  url: absoluteUrl("/"),
  name: `${site.name} — ${site.roles[0]}`,
  mainEntity: { "@type": "Person", "@id": personId, name: site.name },
};

export default function Home() {
  return (
    <PageTransition>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profileJsonLd) }} />
      <main id="main">
        <Hero />
        <Work />
        <About />
        <Experience />
        <Skills />
        <Achievements />
        <Resume />
        <Blog />
        <Contact />
      </main>
    </PageTransition>
  );
}
