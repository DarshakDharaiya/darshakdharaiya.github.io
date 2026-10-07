import { PageTransition } from "@/components/layout/PageTransition";
import { Hero } from "@/components/sections/Hero";
import { Work } from "@/components/sections/work/Work";
import { About } from "@/components/sections/About";
import { Experience } from "@/components/sections/Experience";
import { Skills } from "@/components/sections/Skills";
import { Achievements } from "@/components/sections/Achievements";
import { Resume } from "@/components/sections/Resume";
import { Contact } from "@/components/sections/Contact";

export default function Home() {
  return (
    <PageTransition>
      <main id="main">
        <Hero />
        <Work />
        <About />
        <Experience />
        <Skills />
        <Achievements />
        <Resume />
        <Contact />
      </main>
    </PageTransition>
  );
}
