import type { Experience } from "./types";

/** Experience timeline — newest first. Source: Darshak's résumé (Aug 2026). */
export const experience: Experience[] = [
  {
    company: "Origin Infotech",
    role: "Senior Android Developer / Team Lead",
    start: "Jan 2026",
    end: "Present",
    earlierRoles: [{ role: "Android Developer", start: "Jul 2023", end: "Dec 2025" }],
    location: "Surat, India",
    type: "Full-time",
    description:
      "Leading Android development for consumer apps published on Google Play — messaging, gallery, calendar and document apps used by millions of people.",
    responsibilities: [
      "Set the architecture direction for the Android team, run code reviews and own release quality.",
      "Mentor two junior developers through features, debugging and reviews.",
      "Build apps with Kotlin, Jetpack Compose, Clean Architecture and MVI / MVVM.",
      "Ship monetised apps end to end, from first commit to Google Play release.",
    ],
    achievements: [
      "Built and shipped a Kotlin messaging app (QKSMS Reloaded) end to end on Clean Architecture and MVI — private chats, scheduled messages, spam blocking, backup & restore and themes.",
      "Rebuilt the message sync engine, cutting sync time by ~30% and clearing user-facing freezes and crashes.",
      "Redesigned backup & restore and added one-tap OTP copy, reducing bugs found in QA by ~35%.",
      "Fixed two crash-causing defects in a photo gallery app, and brought a rejected app back onto Google Play within five days by correcting its data safety and permissions declarations.",
      "Reverse-engineered a third-party PDF library shipped without source or docs, unblocking PDF support in a document app.",
    ],
    stack: ["Kotlin", "Jetpack Compose", "Clean Architecture", "MVI", "Hilt", "Coroutines", "Flow", "Room", "WorkManager", "Firebase"],
  },
  {
    company: "WorkDo Pvt Ltd",
    formerly: "Rajodiya Infotech Services",
    role: "Trainee Android Developer",
    start: "Mar 2023",
    end: "Jun 2023",
    location: "Surat, India",
    type: "Traineeship",
    description: "Joined as a trainee and moved to full ticket ownership within three weeks.",
    responsibilities: [
      "Analysed project flows and implemented features end to end.",
      "Debugged issues and delivered fixes under senior review.",
    ],
    achievements: [
      "Built the app's API layer with Retrofit and reusable repository patterns, cutting duplicated networking code across modules.",
      "Took full ownership of tickets within three weeks.",
    ],
    stack: ["Kotlin", "Retrofit", "REST APIs", "MVVM"],
  },
  {
    company: "Intellect Infosoft",
    role: "Intern Android Developer",
    start: "Nov 2022",
    end: "Feb 2023",
    location: "Surat, India",
    type: "Internship",
    description: "Built apps from requirement documents, from Figma designs through to Firebase-backed features.",
    responsibilities: ["Created applications from project specifications.", "Designed project screens in Figma."],
    achievements: ["Integrated ads for revenue and Firebase for data storage and retrieval."],
    stack: ["Kotlin", "Firebase", "Figma", "AdMob"],
  },
];
