import type { Project, Screenshot } from "./types";

/**
 * Projects — the single source of truth for Work, case studies, resume and stats.
 * Store numbers (installs, rating, last update) were taken from the live Google Play listings.
 * Engineering facts (modules, libraries, SDK levels) come from the project source.
 */

const shot = (slug: string, n: number, width = 720, height = 1280, alt = ""): Screenshot => ({
  src: `/projects/${slug}/shot-${n}.webp`,
  width,
  height,
  alt: alt || `${slug} screen ${n}`,
});

const play = (pkg: string) => `https://play.google.com/store/apps/details?id=${pkg}`;

export const projects: Project[] = [
  /* ───────────────────────────── 01 ───────────────────────────── */
  {
    slug: "gallery-photos-videos",
    title: "Gallery — Photos & Videos",
    shortTitle: "Gallery",
    tagline: "A fast, private home for every photo and video on the device.",
    description:
      "An iOS-inspired gallery that organises tens of thousands of photos and videos instantly, with a private locked folder, recycle bin, built-in editor and a gesture-driven video player.",
    role: "Lead Android Engineer — architecture, media pipeline, player, editor",
    platform: "Android",
    stack: ["Kotlin", "MediaStore", "Hilt", "Room", "DataStore", "Media3 / ExoPlayer", "Coroutines", "Firebase"],
    store: {
      packageName: "com.iosgalleryigallery.iphonegallery",
      url: play("com.iosgalleryigallery.iphonegallery"),
      installs: "1M+",
      rating: 4.7,
      lastUpdated: "Jul 2026",
    },
    achievements: [
      "1M+ installs with a 4.7★ rating",
      "49 production releases shipped",
      "Baseline Profiles for faster cold start",
    ],
    accent: "#3aa7c9",
    icon: "/projects/igallery/icon.webp",
    screenshots: [
      shot("igallery", 2, 720, 1280, "Albums grid"),
      shot("igallery", 1, 720, 1280, "Photo timeline"),
      shot("igallery", 3, 720, 1280, "Private locked folder"),
      shot("igallery", 4, 720, 1280, "Photo editor"),
      shot("igallery", 5, 720, 1280, "Video player"),
    ],
    featured: true,
    caseStudy: {
      overview:
        "Gallery is a daily-driver media app: people open it dozens of times a day to find, relive and share moments. It replaces the stock gallery with an iOS-inspired experience — albums, a private locked folder, a recycle bin, a full editor and a gesture-driven video player — while staying fast on mid-range devices with very large libraries.",
      problem:
        "Stock galleries on many Android devices feel slow and cluttered on large libraries, offer no private space, and permanently delete files with a single mis-tap. Users wanted the calm, organised feel of iOS Photos without giving up Android's openness.",
      research: [
        "Store reviews of competing galleries clustered around three complaints: slow loading on big libraries, accidental deletion, and no way to hide personal media.",
        "Profiling on 3–4 GB RAM devices showed thumbnail decoding and MediaStore cursor work on the main thread were the dominant sources of jank.",
        "Scoped storage on Android 11+ changed how deletes, moves and hidden files must work — a design constraint, not an afterthought.",
      ],
      challenges: [
        {
          title: "50,000-item libraries",
          body: "Querying MediaStore and binding thumbnails for very large libraries without dropped frames, while keeping memory flat during fast scrolling.",
        },
        {
          title: "Privacy without root",
          body: "A locked folder that survives media rescans and works within scoped storage, protected by PIN or pattern.",
        },
        {
          title: "Safe deletion",
          body: "A recycle bin that behaves consistently across Android 8 through 14 despite very different storage permission models.",
        },
      ],
      solution:
        "I built a repository layer that pages MediaStore results off the main thread with coroutines and Flow, caches album metadata in Room, and keeps UI state in ViewModels. Hidden media moves into app-private storage with a Room index, so it never reappears in other apps. Deletion routes through a recycle bin with retention, falling back to platform trash requests on newer Android versions. The video player is built on Media3 with custom gesture handling for seek, brightness and volume.",
      architecture: {
        summary: "Single-activity MVVM with a clean repository boundary; Hilt wires every layer.",
        layers: [
          { name: "UI", caption: "Fragments · Adapters · Custom views", items: ["Albums / Timeline", "Editor canvas", "Player gestures", "Pattern & PIN views"] },
          { name: "Presentation", caption: "ViewModels · StateFlow", items: ["AlbumsViewModel", "PlayerViewModel", "RecycleBinViewModel", "EditImageViewModel"] },
          { name: "Domain / Data", caption: "Repositories · Mappers", items: ["Media repository", "EditImageRepository", "Favorites mapping", "Player preferences"] },
          { name: "Platform", caption: "Android & storage", items: ["MediaStore", "Room", "Proto DataStore", "Media3 ExoPlayer"] },
        ],
      },
      uiux: {
        summary:
          "The interface borrows the clarity of iOS Photos — large thumbnails, quiet chrome, obvious actions — adapted to Material navigation patterns Android users expect.",
        principles: [
          "Content first: chrome fades away while browsing.",
          "Every destructive action is reversible.",
          "Gestures map to physical intuition: swipe to seek, pinch to zoom, drag to dismiss.",
        ],
      },
      technologies: [
        { name: "Kotlin + Coroutines", why: "Structured concurrency for MediaStore paging and IO." },
        { name: "Hilt", why: "Compile-time DI across ViewModels, repositories and workers." },
        { name: "Room", why: "Favourites, hidden items and recycle-bin index." },
        { name: "Proto DataStore", why: "Typed player and app preferences." },
        { name: "Media3 / ExoPlayer", why: "Reliable playback with custom gesture controls." },
        { name: "Baseline Profiles", why: "Pre-compiled hot paths for faster cold start." },
        { name: "Firebase", why: "Crashlytics, Analytics and Cloud Messaging." },
      ],
      results: {
        summary: "Gallery grew into one of the highest-rated apps in its category.",
        metrics: [
          { value: "1M+", label: "Installs" },
          { value: "4.7★", label: "Play Store rating" },
          { value: "49", label: "Releases shipped" },
          { value: "100%", label: "Kotlin codebase" },
        ],
      },
      learnings: [
        "Measure on the device your users actually own; flagship profiling hides real jank.",
        "Scoped storage is a product decision — design deletion and privacy flows around it from day one.",
        "Baseline Profiles are among the cheapest performance wins on Android.",
      ],
      code: {
        title: "Paging MediaStore off the main thread",
        language: "kotlin",
        code: `fun observeMedia(bucketId: Long?): Flow<List<MediaItem>> = callbackFlow {
    val observer = object : ContentObserver(null) {
        override fun onChange(selfChange: Boolean) { trySend(Unit) }
    }
    resolver.registerContentObserver(MEDIA_URI, true, observer)
    send(Unit) // initial load
    awaitClose { resolver.unregisterContentObserver(observer) }
}
    .conflate()
    .map { queryMedia(bucketId) }   // cursor work on IO
    .flowOn(Dispatchers.IO)
    .distinctUntilChanged()`,
      },
    },
  },

  /* ───────────────────────────── Messages ───────────────────────────── */
  {
    slug: "messages",
    title: "Messages — SMS & MMS",
    shortTitle: "Messages",
    tagline: "A fast, private messaging app rebuilt on Clean Architecture and MVI.",
    description:
      "A full SMS & MMS client with private chats, scheduled messages, spam blocking, backup & restore, one-tap OTP copy and themes — led end to end, from architecture to release.",
    role: "Lead Android Engineer — architecture, sync engine, features, releases",
    platform: "Android",
    stack: ["Kotlin", "Clean Architecture", "MVI", "Hilt", "Coroutines", "WorkManager", "Jetpack Compose"],
    store: {
      packageName: "com.chatbox.smsmessages.textsmsapp",
      url: play("com.chatbox.smsmessages.textsmsapp"),
      installs: "1M+",
      rating: 3.9,
      lastUpdated: "Aug 2026",
    },
    achievements: ["1M+ installs on Google Play", "Sync engine ~30% faster", "~35% fewer bugs found in QA"],
    accent: "#3a8fd9",
    icon: "/projects/chatbox/icon.webp",
    screenshots: [
      shot("chatbox", 2, 720, 1280, "Conversations"),
      shot("chatbox", 3, 720, 1280, "Chat"),
      shot("chatbox", 4, 720, 1280, "Features"),
      shot("chatbox", 5, 720, 1280, "Themes"),
    ],
    featured: true,
    caseStudy: {
      overview:
        "Messages replaces the system SMS app: conversations, MMS, scheduled sending, spam blocking, backups, private chats and themes. It's the app I led end to end — from the architecture and sync engine to code reviews and Play releases.",
      problem:
        "Becoming the default SMS app means owning delivery, notifications and storage for every message on the phone. The inherited codebase froze while syncing large inboxes, crash reports were climbing, and every new feature risked breaking something unrelated.",
      research: [
        "Crash and ANR reports clustered around the initial message sync on devices with large inboxes.",
        "Reviews asked most often for scheduled messages, spam blocking and reliable backups.",
        "Users were copying one-time passwords by hand — slow, and error-prone for a security-sensitive flow.",
      ],
      challenges: [
        { title: "Sync at scale", body: "Mirroring tens of thousands of threads from the telephony provider without freezing the UI." },
        { title: "Telephony edge cases", body: "Dual-SIM, carrier MMS settings and delivery reports vary widely by OEM and network." },
        { title: "Safe change", body: "Shipping new features quickly without regressions in a security-sensitive app." },
      ],
      solution:
        "I restructured the app into presentation, domain, data, common and SMS/MMS transport modules, with an MVI flow so every screen renders from a single immutable state. The sync engine was rebuilt to work incrementally off the main thread, cutting sync time by around 30% and clearing the freezes users were hitting. On top of that foundation I shipped scheduled messages, spam and number blocking, archive, quick reply, redesigned backup & restore, and one-tap OTP copy straight from the notification.",
      architecture: {
        summary: "Clean Architecture across five Gradle modules; MVI in the presentation layer; Hilt wires it together.",
        layers: [
          { name: "Presentation", caption: "Activities · Compose · MVI", items: ["Conversations", "Compose / Quick reply", "Blocking", "Backup & restore", "Themes"] },
          { name: "Domain", caption: "Interactors", items: ["AddScheduledMessage", "MarkArchived", "Blocking rules", "OTP detection"] },
          { name: "Data", caption: "Repositories · Sync", items: ["Message repository", "Incremental sync engine", "Backup repository"] },
          { name: "Transport", caption: "SMS / MMS", items: [":android-smsmms", "Telephony provider", "WorkManager", "AlarmManager"] },
        ],
      },
      uiux: {
        summary: "Messaging should disappear behind the conversation: familiar layout, instant search, quiet controls.",
        principles: ["Instant feedback on send.", "The code you need is one tap away.", "Nothing is ever lost — backup is first-class."],
      },
      technologies: [
        { name: "Kotlin + Coroutines", why: "Structured concurrency for sync and IO." },
        { name: "MVI", why: "One immutable state per screen — predictable and testable." },
        { name: "Hilt", why: "Scoped dependency injection across modules." },
        { name: "WorkManager", why: "Scheduled sending and background jobs that survive reboots." },
        { name: "Jetpack Compose", why: "New screens built declaratively alongside existing views." },
      ],
      results: {
        summary: "Faster, steadier, and trusted as the default SMS app by over a million people.",
        metrics: [
          { value: "1M+", label: "Installs" },
          { value: "~30%", label: "Faster message sync" },
          { value: "~35%", label: "Fewer bugs found in QA" },
          { value: "5", label: "Gradle modules" },
        ],
      },
      learnings: [
        "Unidirectional state makes complex screens debuggable.",
        "Treat telephony as hostile input: validate everything, assume nothing.",
        "The fastest sync is the one that only does what changed.",
      ],
      comparison: {
        title: "Message sync",
        before: { label: "Full re-sync", points: ["Re-read the whole inbox on changes", "UI freezes on large inboxes", "Rising crash and ANR reports"] },
        after: { label: "Incremental engine", points: ["Only changed threads are synced", "Runs off the main thread", "~30% faster, freezes cleared"] },
      },
    },
  },

  /* ───────────────────────────── 02 ───────────────────────────── */
  {
    slug: "calendar",
    title: "Calendar — Planner & Holidays",
    shortTitle: "Calendar",
    tagline: "Year, month, week and day — with holidays, tasks and reminders.",
    description:
      "A full calendar with a custom-drawn week view, national holidays for many countries, tasks, reminders and agenda notifications.",
    role: "Android Engineer — custom views, scheduling, data layer",
    platform: "Android",
    stack: ["Kotlin", "Custom Views", "Hilt", "Room", "WorkManager", "Coroutines", "Compose"],
    store: {
      packageName: "com.scheduleevent.calender",
      url: play("com.scheduleevent.calender"),
      installs: "1M+",
      rating: 4.3,
      lastUpdated: "Sep 2026",
    },
    achievements: ["1M+ installs", "Custom canvas-rendered week view", "Holiday data for many countries"],
    accent: "#e0794a",
    icon: "/projects/calendar/icon.webp",
    screenshots: [
      shot("calendar", 2, 720, 1280, "Month view"),
      shot("calendar", 3, 720, 1280, "Week view"),
      shot("calendar", 4, 720, 1280, "Agenda"),
      shot("calendar", 5, 720, 1280, "Holidays"),
    ],
    featured: true,
    caseStudy: {
      overview:
        "Calendar brings every kind of plan into one place: events, tasks, reminders and national holidays, across year, month, week and day views — with an agenda that notifies at the right moment.",
      problem:
        "Off-the-shelf calendar widgets couldn't render dense, overlapping events smoothly, and users wanted holidays and personal tasks alongside their events.",
      research: [
        "Library week views allocated objects per event on every frame, causing GC stutter while scrolling busy weeks.",
        "Holiday lookups were a top in-app search query, varying heavily by country.",
      ],
      challenges: [
        { title: "Overlapping events", body: "Laying out concurrent events into readable columns, recalculated as the user pinches and scrolls." },
        { title: "Reliable reminders", body: "Exact-time notifications under Doze and Android 12+ exact-alarm restrictions." },
      ],
      solution:
        "I wrote a dedicated `weekview` module that draws events directly on Canvas: an EventChipsFactory groups overlaps, an EventChipBoundsCalculator lays out columns and an EventChipDrawer renders them from a cache, allocation-free during scroll. Events, tasks, reminders and holidays live in Room behind repositories; an AgendaNotificationScheduler uses WorkManager and alarms to deliver reminders on time.",
      architecture: {
        summary: "MVVM with Hilt, plus an isolated, reusable custom-view module.",
        layers: [
          { name: "UI", caption: "Activities · Custom views", items: ["Month / Year pager", "WeekView (Canvas)", "Add event / task / reminder", "Holidays"] },
          { name: "Presentation", caption: "ViewModels", items: ["MainViewModel", "AddEventViewModel", "CalendarEventDetailViewModel"] },
          { name: "Data", caption: "Repositories · Mappers", items: ["EventRepository", "CalendarEventsRepository", "National holiday fetcher"] },
          { name: "Platform", caption: "Android", items: ["Room", "WorkManager", "AlarmManager", "Notifications"] },
        ],
      },
      uiux: {
        summary: "Dense information made legible: colour-coded chips, clear time gutters and fast view switching.",
        principles: ["Today is always one tap away.", "Overlaps stay readable at every zoom.", "Holidays inform, never clutter."],
      },
      technologies: [
        { name: "Custom Canvas views", why: "Allocation-free rendering of dense weeks." },
        { name: "Hilt", why: "Dependency graph across modules." },
        { name: "Room", why: "Events, tasks, reminders and holiday caches." },
        { name: "WorkManager", why: "Agenda scheduling that survives reboots." },
        { name: "Baseline Profiles", why: "Smooth first scroll after install." },
      ],
      results: {
        summary: "A dependable everyday planner trusted by over a million people.",
        metrics: [
          { value: "1M+", label: "Installs" },
          { value: "4.3★", label: "Play Store rating" },
          { value: "4", label: "Calendar views" },
          { value: "1", label: "Reusable week-view module" },
        ],
      },
      learnings: [
        "When a library fights you on performance, owning the rendering is often simpler.",
        "Time zones and DST deserve their own tests.",
      ],
      code: {
        title: "Grouping overlapping events into columns",
        language: "kotlin",
        code: `fun layoutColumns(chips: List<EventChip>): List<List<EventChip>> {
    val columns = mutableListOf<MutableList<EventChip>>()
    for (chip in chips.sortedBy { it.start }) {
        val column = columns.firstOrNull { it.last().end <= chip.start }
        if (column != null) column += chip else columns += mutableListOf(chip)
    }
    return columns
}`,
      },
    },
  },

  /* ───────────────────────────── 03 ───────────────────────────── */
  {
    slug: "pdf-reader",
    title: "PDF Reader & Document Suite",
    shortTitle: "PDF Reader",
    tagline: "A 34-module document platform: read, scan and manage files.",
    description:
      "A modern document app for PDFs and Office files with a document scanner and PDF tools — built as a highly modular Compose codebase with convention plugins.",
    role: "Android Engineer — architecture, build system, reader & scanner features",
    platform: "Android",
    stack: ["Kotlin", "Jetpack Compose", "Koin", "CameraX", "ML Kit", "Gradle convention plugins"],
    store: {
      packageName: "com.smartpdf.pdfviewer.documentreader",
      url: play("com.smartpdf.pdfviewer.documentreader"),
      installs: "New",
      lastUpdated: "Sep 2026",
    },
    achievements: ["34 Gradle modules", "api / data / domain / ui per feature", "Recently launched on Google Play"],
    accent: "#e05a4f",
    icon: "/projects/pdf/icon.webp",
    screenshots: [
      shot("pdf", 1, 446, 800, "Document list"),
      shot("pdf", 2, 421, 801, "Reader"),
      shot("pdf", 3, 451, 798, "Tools"),
    ],
    featured: true,
    caseStudy: {
      overview:
        "A document platform for reading PDFs and Office files, scanning paper into PDFs and running everyday PDF tools — architected from day one to scale with features and with a team.",
      problem:
        "Document apps tend to become monoliths where every new tool slows the build and couples unrelated code. This one had to support many readers, a scanner and a growing toolset without that decay.",
      research: [
        "Studied modularisation patterns from large open-source Android codebases and Google's architecture guidance.",
        "Benchmarked rendering approaches for PDF fidelity versus APK size.",
      ],
      challenges: [
        { title: "Build scalability", body: "Keeping configuration consistent and builds fast across dozens of modules." },
        { title: "Format coverage", body: "PDF, JPEG 2000-encoded PDFs and Office formats each need a different engine." },
        { title: "Scanner quality", body: "Edge detection and perspective correction that work in poor light." },
      ],
      solution:
        "Each feature is split into `api`, `data`, `domain` and `ui` modules, so features depend only on each other's APIs. Shared Gradle logic lives in `build-logic` convention plugins. The reader is pluggable: a pdf.js-based engine, a JPEG 2000 decoder module and an Office document viewer sit behind one reader API. The scanner combines CameraX capture, ML Kit and an image-processing module for edge detection and cleanup.",
      architecture: {
        summary: "Feature-sliced modularisation with convention plugins and Koin for DI.",
        layers: [
          { name: "App & navigation", caption: "Composition root", items: [":app", ":navigation", ":features:splash", ":features:settings"] },
          { name: "Features", caption: "api · data · domain · ui", items: ["documents", "reader (pdf, office)", "scanner", "tools", "image-picker", "language"] },
          { name: "Core", caption: "Shared foundations", items: [":core:ui", ":core:common", ":core:datastore", ":core:pdf:engine"] },
          { name: "Build", caption: "Gradle", items: ["build-logic convention plugins", "Version catalog", "Baseline profile module"] },
        ],
      },
      uiux: {
        summary: "Documents first: a clean library, a distraction-free reader and tools that explain themselves.",
        principles: ["Open any file in one tap.", "The reader gets out of the way.", "Tools preview results before committing."],
      },
      technologies: [
        { name: "Jetpack Compose", why: "Declarative UI with shared design-system components." },
        { name: "Koin", why: "Lightweight DI that suits many small modules." },
        { name: "Convention plugins", why: "One source of truth for Android/Kotlin configuration." },
        { name: "CameraX + ML Kit", why: "Reliable capture and on-device document detection." },
        { name: "DataStore", why: "Typed preferences in a core module." },
      ],
      results: {
        summary: "A codebase where adding a new tool is a new module — not a new risk.",
        metrics: [
          { value: "34", label: "Gradle modules" },
          { value: "4", label: "Layers per feature" },
          { value: "3", label: "Reader engines" },
          { value: "2026", label: "Launched" },
        ],
      },
      learnings: [
        "Module boundaries are API design; name them like it.",
        "Convention plugins pay for themselves by the fifth module.",
      ],
      code: {
        title: "A convention plugin for every feature module",
        language: "kotlin",
        code: `class FeatureUiConventionPlugin : Plugin<Project> {
    override fun apply(target: Project) = with(target) {
        pluginManager.apply("app.android.library.compose")
        dependencies {
            add("implementation", project(":core:ui"))
            add("implementation", project(":navigation"))
            add("implementation", libs.findBundle("koin-compose").get())
        }
    }
}`,
      },
    },
  },

  /* ───────────────────────────── Also shipped ───────────────────────────── */
  {
    slug: "gallery-photo-album",
    title: "Gallery — Photo Album",
    shortTitle: "Photo Album",
    tagline: "A Jetpack Compose gallery with an offline-first media library.",
    description: "A Compose-first gallery with zoomable viewers, a Media3 player and Room-backed video library.",
    role: "Android Engineer",
    platform: "Android",
    stack: ["Kotlin", "Jetpack Compose", "Hilt", "Room", "Media3"],
    store: {
      packageName: "com.albumgallery.imagegallery.photogallery",
      url: play("com.albumgallery.imagegallery.photogallery"),
      installs: "1M+",
      rating: 4.5,
      lastUpdated: "Apr 2026",
    },
    achievements: ["1M+ installs", "Compose UI"],
    accent: "#d98a3a",
    icon: "/projects/album/icon.webp",
    screenshots: [shot("album", 1), shot("album", 2), shot("album", 3)],
    featured: false,
  },

];

export const featuredProjects = projects.filter((p) => p.featured && p.caseStudy);
export const otherProjects = projects.filter((p) => !p.featured);
export const getProject = (slug: string) => projects.find((p) => p.slug === slug);
