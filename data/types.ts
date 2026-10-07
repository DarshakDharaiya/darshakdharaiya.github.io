export type Social = {
  id: "github" | "linkedin" | "email" | "playstore" | "x";
  label: string;
  href: string;
  handle: string;
};

export type Screenshot = { src: string; width: number; height: number; alt: string };

export type Metric = { value: string; label: string; note?: string };

export type ArchitectureLayer = { name: string; caption: string; items: string[] };

export type CodeSnippet = { title: string; language: "kotlin" | "java" | "xml" | "groovy"; code: string };

export type Comparison = {
  title: string;
  before: { label: string; points: string[] };
  after: { label: string; points: string[] };
};

export type CaseStudy = {
  overview: string;
  problem: string;
  research: string[];
  challenges: { title: string; body: string }[];
  solution: string;
  architecture: { summary: string; layers: ArchitectureLayer[] };
  uiux: { summary: string; principles: string[] };
  technologies: { name: string; why: string }[];
  results: { summary: string; metrics: Metric[] };
  learnings: string[];
  code?: CodeSnippet;
  comparison?: Comparison;
  /** Optional MP4/WebM walkthrough in /public */
  video?: { src: string; poster?: string };
};

export type Project = {
  slug: string;
  title: string;
  /** Short name used in tight spaces */
  shortTitle: string;
  tagline: string;
  description: string;
  role: string;
  platform: string;
  stack: string[];
  /** Play Store data — verified from the live listing */
  store: {
    packageName: string;
    url: string;
    installs: string;
    rating?: number;
    lastUpdated: string;
  };
  achievements: string[];
  /** Per-project accent used for the stage glow, kept low-saturation */
  accent: string;
  icon: string;
  screenshots: Screenshot[];
  links?: { github?: string; live?: string };
  featured: boolean;
  caseStudy?: CaseStudy;
};

export type Experience = {
  company: string;
  /** Former name, shown after the company */
  formerly?: string;
  role: string;
  start: string;
  end: string;
  /** Earlier titles at the same company (promotions), newest first */
  earlierRoles?: { role: string; start: string; end: string }[];
  location: string;
  type: string;
  description: string;
  responsibilities: string[];
  achievements: string[];
  stack: string[];
};

export type SkillLevel = "core" | "strong" | "familiar";
export type Skill = { name: string; level: SkillLevel };
export type SkillCategory = { id: string; title: string; blurb: string; skills: Skill[] };
