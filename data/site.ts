/**
 * ─────────────────────────────────────────────
 *  EDIT ME — personal profile & global copy
 * ─────────────────────────────────────────────
 * Source: Darshak's résumé (Aug 2026). Update here and the whole site follows.
 */
export const site = {
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://darshak.dev", // TODO: your production domain
  name: "Darshak Dharaiya",
  firstName: "Darshak",
  lastName: "Dharaiya",
  initial: "D",
  roles: ["Senior Android Developer", "Team Lead", "Kotlin & Jetpack Compose"],
  headline: "Senior Android Developer building products used by millions.",
  statement:
    "I lead Android development and build fast, reliable apps in Kotlin and Jetpack Compose — shipped to millions of real people on Google Play.",
  location: "Surat, India",
  timezone: "Asia/Kolkata",
  availability: "Open to Senior Android & Team Lead roles · Open to relocation",
  email: "darshak.dharaiya44@gmail.com",
  phone: "+91 88284 70764",
  /** Set true to show the phone number on the site and in /resume.pdf (both are public) */
  publishPhone: false,
  resumePath: "/resume.pdf",
  keywords: [
    "Senior Android Developer",
    "Android Team Lead",
    "Kotlin",
    "MVI",
    "Clean Architecture",
    "Jetpack Compose",
    "Software Engineer",
    "Portfolio",
    "Darshak Dharaiya",
  ],
} as const;

export const about = {
  statement: "I care about the details people feel but rarely notice.",
  bio: [
    "I'm a Senior Android Developer and team lead at Origin Infotech in Surat, with over three years of building apps that ship to production — messaging, gallery, calendar and document apps that people open dozens of times a day.",
    "Since January 2026 I've led the Android team's architecture decisions, code reviews and release quality, and mentored two junior developers. I'm known for making slow apps fast, fixing crashes at the root, and getting apps through Google Play review.",
  ],
  /** Animated metrics — `value` is numeric for the counter; prefix/suffix wrap it. */
  metrics: [
    { value: 3, suffix: "+", label: "Years building Android apps" },
    { value: 4, suffix: "M+", label: "Installs across live apps" },
    { value: 30, suffix: "%", label: "Faster message sync after rebuild" },
    { value: 2, suffix: "", label: "Junior developers mentored" },
  ],
};

export const contact = {
  eyebrow: "Have an idea?",
  heading: ["Let's build", "something great."],
  cta: "Start a conversation",
};
