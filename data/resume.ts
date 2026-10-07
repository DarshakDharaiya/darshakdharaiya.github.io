/**
 * Résumé — one source of truth for the on-site preview AND the generated /resume.pdf.
 * Content consolidated from Darshak's résumés (Aug 2026 + 3-year Android) and live Google Play data.
 */
import { site } from "./site";
import { socials } from "./social";
import { experience } from "./experience";
import { projects } from "./projects";

const store = (slug: string) => {
  const p = projects.find((x) => x.slug === slug);
  if (!p) return "";
  return [p.store.installs !== "New" ? `${p.store.installs} installs` : null, p.store.rating ? `${p.store.rating}★` : null]
    .filter(Boolean)
    .join(" · ");
};

const linkedin = socials.find((s) => s.id === "linkedin");

export const resume = {
  name: site.name,
  title: "Senior Android Developer & Team Lead",
  headline: "Kotlin · Jetpack Compose · Clean Architecture · MVI",
  contact: {
    email: site.email,
    phone: site.publishPhone ? site.phone : null,
    location: "Surat, Gujarat, India",
    linkedin: linkedin?.href.replace(/^https?:\/\/(www\.)?/, "") ?? null,
    website: site.url.replace(/^https?:\/\//, ""),
  },
  summary:
    "Senior Android Developer and team lead with 3+ years of building and shipping production apps used by millions on Google Play. Works day to day in Kotlin and Jetpack Compose, and has led architecture decisions, code reviews and release quality for the Android team since January 2026. Strong record of making slow apps fast, fixing crashes at the root and getting apps through Google Play review. Seeking a Senior Android Developer or Android Team Lead role — open to relocation.",
  highlights: [
    "4M+ installs across live Google Play apps",
    "~30% faster message sync after rebuilding the engine",
    "~35% fewer QA-found bugs after backup/restore redesign",
    "Leads architecture & code review; mentors 2 developers",
  ],
  experience,
  projects: [
    {
      title: "Messages — SMS & MMS",
      meta: store("messages"),
      line: "Clean Architecture + MVI messaging app: private chats, scheduled messages, spam blocking, backup & restore, one-tap OTP copy and themes. Rebuilt sync engine ~30% faster.",
    },
    {
      title: "PDF Reader, Editor & Office Suite",
      meta: "Recently launched",
      line: "Compose / Clean Architecture app — view, edit, sign, merge, split and compress PDFs, plus Office viewing on a PDFium engine. 34-module Gradle build.",
    },
    {
      title: "Gallery & Media Manager",
      meta: store("gallery-photos-videos"),
      line: "MVVM app on Kotlin Flow and Room: albums, trash, secure vault with PIN/pattern, in-app editing and a gesture-driven video player.",
    },
    {
      title: "Calendar — Planner & Holidays",
      meta: store("calendar"),
      line: "Custom Canvas week view, events, tasks, reminders and national holidays; WorkManager-based agenda notifications.",
    },
    {
      title: "Video Player",
      meta: "",
      line: "Local playback and network streaming with gesture controls (seek, volume, brightness) and Predictive Back support.",
    },
  ],
  skills: [
    { group: "Languages", items: ["Kotlin", "Java", "C/C++", "XML"] },
    { group: "UI", items: ["Jetpack Compose", "Android Views", "Material Design", "Navigation", "Android SDK"] },
    { group: "Architecture", items: ["Clean Architecture", "Multi-Module", "MVI", "MVVM", "SOLID", "Hilt", "Dagger"] },
    { group: "Data & Async", items: ["Coroutines", "Flow", "Room", "SQLite", "LiveData", "WorkManager", "ContentProvider"] },
    { group: "Networking", items: ["Retrofit", "OkHttp", "REST APIs", "Firebase"] },
    { group: "Tooling & Testing", items: ["Gradle", "Git", "GitHub Actions", "JUnit", "Espresso", "Google Play Console", "Agile/Scrum"] },
    { group: "Leadership", items: ["Code review", "Mentoring", "Release management", "Team management"] },
  ],
  education: [
    {
      school: "Parul Institute of Engineering & Technology, Parul University",
      place: "Vadodara, Gujarat",
      degree: "B.Tech, Information Technology",
      period: "2019 — 2023",
      detail: "CGPA 7.6 / 10",
    },
  ],
  languages: ["English (professional working proficiency)", "Hindi", "Gujarati", "Marathi"],
};

export type Resume = typeof resume;
