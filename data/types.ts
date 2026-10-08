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

/* ───────────────────────────── Writing ───────────────────────────── */

/**
 * Post bodies are structured blocks rather than Markdown or MDX: the rest of the
 * site is already data-driven TypeScript, and this keeps posts type-checked, free
 * of a parser dependency, and renderable with the same components the case studies
 * use (CodeBlock in particular).
 */
export type PostBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  | { type: "code"; snippet: CodeSnippet }
  | { type: "note"; tone: "tip" | "warn"; title: string; text: string }
  | { type: "table"; caption?: string; head: string[]; rows: string[][] };

export type PostCategory = "Problem → Solution" | "Deep dive" | "What's new";

export type Post = {
  slug: string;
  title: string;
  /** One line for cards, meta description and OG */
  excerpt: string;
  category: PostCategory;
  /** ISO date — drives sort order and <time dateTime> */
  date: string;
  /** Whole minutes, rounded from the drafted body */
  readingMinutes: number;
  tags: string[];
  /** Pulled out above the body as the question the post answers */
  question: string;
  body: PostBlock[];
  /** Shown as the closing summary */
  takeaways: string[];
  featured?: boolean;
};
