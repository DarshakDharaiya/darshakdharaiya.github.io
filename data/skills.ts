import type { SkillCategory } from "./types";

/** Source: Darshak's résumé (Aug 2026). */
export const skillCategories: SkillCategory[] = [
  {
    id: "android",
    title: "Android",
    blurb: "Native, production-grade apps in Kotlin — Compose-first, Views where it counts.",
    skills: [
      { name: "Kotlin", level: "core" },
      { name: "Jetpack Compose", level: "core" },
      { name: "Java", level: "strong" },
      { name: "Android Views / XML", level: "strong" },
      { name: "Material Design", level: "strong" },
      { name: "Navigation", level: "strong" },
      { name: "MediaStore", level: "strong" },
      { name: "ContentProvider", level: "strong" },
    ],
  },
  {
    id: "architecture",
    title: "Architecture",
    blurb: "Codebases that stay fast to change as they grow — and as the team grows.",
    skills: [
      { name: "Clean Architecture", level: "core" },
      { name: "MVI", level: "core" },
      { name: "MVVM", level: "core" },
      { name: "Multi-Module", level: "strong" },
      { name: "SOLID", level: "strong" },
      { name: "Hilt", level: "core" },
      { name: "Dagger", level: "strong" },
    ],
  },
  {
    id: "data",
    title: "Data & Async",
    blurb: "Smooth, crash-free apps: structured concurrency and reliable local data.",
    skills: [
      { name: "Coroutines", level: "core" },
      { name: "Flow", level: "core" },
      { name: "Room", level: "core" },
      { name: "SQLite", level: "strong" },
      { name: "LiveData", level: "strong" },
      { name: "WorkManager", level: "strong" },
    ],
  },
  {
    id: "services",
    title: "Networking & Services",
    blurb: "Talking to the outside world, observably.",
    skills: [
      { name: "Retrofit", level: "core" },
      { name: "OkHttp", level: "strong" },
      { name: "REST APIs", level: "core" },
      { name: "Firebase", level: "strong" },
    ],
  },
  {
    id: "tools",
    title: "Tooling & Testing",
    blurb: "From pull request to Play Store, with quality gates in between.",
    skills: [
      { name: "Gradle", level: "strong" },
      { name: "Git", level: "core" },
      { name: "GitHub Actions", level: "strong" },
      { name: "JUnit", level: "strong" },
      { name: "Espresso", level: "familiar" },
      { name: "Google Play Console", level: "core" },
      { name: "Android Studio", level: "core" },
      { name: "Figma", level: "strong" },
      { name: "Agile / Scrum", level: "strong" },
    ],
  },
];
