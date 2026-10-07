import { featuredProjects, otherProjects } from "@/data/projects";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ProjectCard } from "./ProjectCard";
import { MoreApps } from "./MoreApps";

export function Work() {
  return (
    <section id="work" data-mood="work" aria-labelledby="work-title" className="py-section">
      <div className="container-x">
        <SectionHeader
          index="01"
          eyebrow="Selected work"
          title={["Products in the hands", "of millions."]}
          lead="Production apps I've built and led — from a messaging app millions rely on to a 34-module document platform."
        />
        <div className="space-y-36 md:space-y-48">
          {featuredProjects.map((p, i) => (
            <ProjectCard key={p.slug} project={p} index={i} />
          ))}
        </div>
      </div>
      <MoreApps projects={otherProjects} />
    </section>
  );
}
