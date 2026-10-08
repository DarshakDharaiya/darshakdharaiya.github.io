import type { Post } from "./types";

/**
 * ─────────────────────────────────────────────
 *  EDIT ME — writing
 * ─────────────────────────────────────────────
 * Posts are the single source of truth for the Blog section, /blog/[slug] and the
 * sitemap. Newest first is computed, not hand-maintained: sort on `date`.
 *
 * A note on numbers: benchmark figures below are from the runs described in each
 * post (device and build type are always stated). Re-measure before quoting them
 * anywhere else — startup and frame timings move with device, ROM and build.
 */
export const posts: Post[] = [
  /* ───────────────────────────── 01 ───────────────────────────── */
  {
    slug: "edge-to-edge-is-not-optional",
    title: "Edge-to-edge is not optional any more",
    excerpt:
      "Android 15 started drawing your app behind the system bars whether you asked for it or not. Here is what actually breaks, and the inset code that fixes it for good.",
    category: "What's new",
    date: "2026-07-18",
    readingMinutes: 7,
    tags: ["Android 15", "Insets", "Compose", "Views"],
    question:
      "My buttons are under the navigation bar after bumping targetSdk. Why, and what is the correct fix?",
    featured: true,
    body: [
      {
        type: "p",
        text: "For years edge-to-edge was something you opted into. You called enableEdgeToEdge(), you handled the insets, and if you did nothing your app kept its comfortable letterbox between the status bar and the navigation bar. That default is gone. Once your app targets SDK 35, the system draws it edge-to-edge for you, and anything you anchored to the bottom of the screen now sits underneath the navigation bar.",
      },
      {
        type: "p",
        text: "The opt-out existed for exactly one release. Targeting SDK 36 removes it, so treating this as a flag to flip is a way to do the same migration twice. It is worth doing properly once.",
      },
      {
        type: "note",
        tone: "warn",
        title: "The symptom is not always obvious",
        text: "A FAB that is merely close to the gesture bar still receives touches, so this rarely shows up as a crash or a failing test. It shows up as one-star reviews saying the send button does not work on a particular phone.",
      },
      { type: "h2", text: "What the system is actually doing" },
      {
        type: "p",
        text: "Edge-to-edge means your window now extends under the status and navigation bars. The system tells you how much of the window is obscured through WindowInsets. Nothing is hidden from you — but nothing is reserved for you either. The job is to take those insets and turn them into padding on the right elements.",
      },
      {
        type: "p",
        text: "The common mistake is applying insets at the top of the tree. Pad your root container and you get the correct safe area, but your list stops scrolling under the status bar, the app looks boxed in, and you have thrown away the reason edge-to-edge exists. Insets belong on the elements that must stay clear: the top app bar, the bottom bar, the FAB, the content padding of a scrolling list.",
      },
      { type: "h2", text: "Compose: consume the right insets in the right place" },
      {
        type: "p",
        text: "Scaffold already knows about this. Give it the window insets and use the PaddingValues it hands back — but pass them as contentPadding to the list rather than padding the list itself. That way items scroll under the bars and still come to rest in a reachable place.",
      },
      {
        type: "code",
        snippet: {
          title: "MainActivity.kt",
          language: "kotlin",
          code: `class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
    setContent { AppTheme { InboxScreen() } }
  }
}

@Composable
fun InboxScreen(items: List<Message>) {
  Scaffold(
    topBar = { TopAppBar(title = { Text("Inbox") }) },
    floatingActionButton = { ComposeFab() },
  ) { padding ->
    // contentPadding, not Modifier.padding: rows scroll under the bars
    // but the first and last row still stop somewhere reachable.
    LazyColumn(
      contentPadding = padding,
      modifier = Modifier.fillMaxSize(),
    ) {
      items(items, key = { it.id }) { MessageRow(it) }
    }
  }
}`,
        },
      },
      {
        type: "p",
        text: "For a bar you draw yourself, ask for the specific inset you care about instead of padding by the whole safe area. windowInsetsPadding keeps the bar flush with the bottom of the screen while lifting its content above the gesture handle.",
      },
      {
        type: "code",
        snippet: {
          title: "BottomActionBar.kt",
          language: "kotlin",
          code: `@Composable
fun BottomActionBar(onSend: () -> Unit) {
  Surface(tonalElevation = 3.dp) {
    Row(
      modifier = Modifier
        .fillMaxWidth()
        // Background reaches the screen edge; content stops above the bar.
        .windowInsetsPadding(WindowInsets.navigationBars)
        .padding(horizontal = 16.dp, vertical = 8.dp),
      verticalAlignment = Alignment.CenterVertically,
    ) {
      Spacer(Modifier.weight(1f))
      Button(onClick = onSend) { Text("Send") }
    }
  }
}`,
        },
      },
      { type: "h2", text: "Views: one listener, applied where it matters" },
      {
        type: "p",
        text: "In a View-based screen the equivalent is a single OnApplyWindowInsetsListener on the element that needs clearance. Read systemBars and displayCutout together — a cutout in landscape will bite you otherwise — and return the insets so other listeners still see them.",
      },
      {
        type: "code",
        snippet: {
          title: "EditorActivity.kt",
          language: "kotlin",
          code: `ViewCompat.setOnApplyWindowInsetsListener(binding.bottomBar) { view, windowInsets ->
  val bars = windowInsets.getInsets(
    WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
  )
  view.updatePadding(left = bars.left, right = bars.right, bottom = bars.bottom)
  // Returning CONSUMED here would silently break every sibling listener.
  windowInsets
}`,
        },
      },
      {
        type: "note",
        tone: "tip",
        title: "Keyboard insets are a separate type",
        text: "If a text field is covered when the keyboard opens, systemBars is not what you want. Use WindowInsets.ime in Compose, or Type.ime() in Views, and prefer imeNestedScroll for a chat-style screen so the list follows the keyboard instead of jumping.",
      },
      { type: "h2", text: "A checklist that catches the rest" },
      {
        type: "list",
        ordered: true,
        items: [
          "Walk every screen on a device with gesture navigation and again with three-button navigation. The navigation bar inset differs by about 24dp between them, and three-button is where things usually break.",
          "Rotate to landscape on a phone with a display cutout, and check the left and right insets, not just top and bottom.",
          "Open the keyboard on every screen that has a text field.",
          "Check dialogs and bottom sheets. They have their own windows and do not inherit the padding you applied to the activity.",
          "Look for hard-coded status bar heights. A constant of 24dp was wrong years ago and is very wrong now.",
          "Check any screen that hides the system bars, such as a video player or photo viewer. Immersive mode and edge-to-edge interact, and the inset values change as the bars come and go.",
        ],
      },
      { type: "h2", text: "Why it is worth more than a flag" },
      {
        type: "p",
        text: "Done properly, edge-to-edge is not a compliance exercise. Content that scrolls under a translucent status bar reads as taller, and a list that runs to the physical edge of the display looks like it belongs to the device rather than to a box drawn on it. The work is the same either way. The difference is whether you spend it once, deliberately, or twice under deadline.",
      },
    ],
    takeaways: [
      "targetSdk 35 forces edge-to-edge; targetSdk 36 removes the opt-out. Migrate once, properly.",
      "Apply insets to the elements that need clearance, not to the root — padding the root throws away the benefit.",
      "Use contentPadding on scrolling lists so items pass under the bars but still rest somewhere reachable.",
      "systemBars, displayCutout and ime are different inset types. Most bugs come from using only the first.",
      "Test with three-button navigation and with a cutout in landscape; that is where the gaps show.",
    ],
  },

  /* ───────────────────────────── 02 ───────────────────────────── */
  {
    slug: "cold-start-baseline-profiles",
    title: "Cold start, and the profile that fixes it",
    excerpt:
      "Baseline Profiles are the rare optimisation with a large payoff and almost no design cost. What they do, how to generate one that is actually representative, and how to prove it worked.",
    category: "Problem → Solution",
    date: "2026-06-02",
    readingMinutes: 9,
    tags: ["Performance", "Baseline Profiles", "Macrobenchmark", "R8"],
    question: "The app takes too long to show its first screen. Where does that time actually go?",
    featured: true,
    body: [
      {
        type: "p",
        text: "A fresh install runs your code interpreted. Android ships your app as DEX bytecode, and on first launch the runtime has no compiled native code for any of it. It interprets, notices which methods are hot, and compiles those in the background over the next few runs. By the time the app feels quick, the user has already formed an opinion.",
      },
      {
        type: "p",
        text: "A Baseline Profile short-circuits that. It is a list of classes and methods, shipped inside the APK, that tells the runtime what to compile ahead of time at install. The work is the same work the JIT would have done — you are just not making the user wait for it.",
      },
      { type: "h2", text: "Measure before you touch anything" },
      {
        type: "p",
        text: "Startup is the easiest metric to fool yourself about. A warm launch from the recents list is not a cold start, and the first launch after installing a debug build is not representative of anything. Macrobenchmark exists because this measurement is fiddly, and it handles the parts that are easy to get wrong: killing the process, dropping caches, and separating compilation modes.",
      },
      {
        type: "code",
        snippet: {
          title: "StartupBenchmark.kt",
          language: "kotlin",
          code: `@get:Rule
val benchmarkRule = MacrobenchmarkRule()

@Test
fun coldStartNoCompilation() = startup(CompilationMode.None())

@Test
fun coldStartWithBaselineProfile() = startup(
  CompilationMode.Partial(baselineProfileMode = BaselineProfileMode.Require)
)

private fun startup(mode: CompilationMode) = benchmarkRule.measureRepeated(
  packageName = "com.example.gallery",
  metrics = listOf(StartupTimingMetric()),
  compilationMode = mode,
  startupMode = StartupMode.COLD,
  iterations = 15,
) {
  pressHome()
  startActivityAndWait()
  // Wait for real content, not just the first frame: a splash screen
  // renders instantly and will happily report a great number.
  device.wait(Until.hasObject(By.res("gallery_grid")), 5_000)
}`,
        },
      },
      {
        type: "note",
        tone: "warn",
        title: "Measure to first useful frame",
        text: "StartupTimingMetric reports timeToInitialDisplay, which a splash screen satisfies immediately. If your grid populates half a second later, the number you optimised is not the number the user feels. Wait for real content, or report timeToFullDisplay via reportFullyDrawn().",
      },
      { type: "h2", text: "Generating a profile that represents the real app" },
      {
        type: "p",
        text: "The generator runs your app and records what executes. That means the quality of the profile is exactly the quality of the journey you write. A generator that launches the activity and stops records your startup path and nothing else — which is a fine start, and genuinely most of the win. But if the first thing users do is scroll, scrolling belongs in the profile too.",
      },
      {
        type: "code",
        snippet: {
          title: "BaselineProfileGenerator.kt",
          language: "kotlin",
          code: `@get:Rule
val rule = BaselineProfileRule()

@Test
fun generate() = rule.collect(packageName = "com.example.gallery") {
  pressHome()
  startActivityAndWait()

  // Startup alone is most of the benefit. Adding the first interaction
  // covers the code paths users hit in the opening seconds.
  device.wait(Until.hasObject(By.res("gallery_grid")), 5_000)
  val grid = device.findObject(By.res("gallery_grid"))
  grid.setGestureMargin(device.displayWidth / 5)
  repeat(3) { grid.fling(Direction.DOWN) }
  device.waitForIdle()
}`,
        },
      },
      {
        type: "p",
        text: "The Gradle plugin wires the rest. It builds a non-minified variant, runs the generator on a device or a managed emulator, and drops the result into src/main/baselineProfiles where it is packaged automatically.",
      },
      {
        type: "code",
        snippet: {
          title: "app/build.gradle.kts",
          language: "groovy",
          code: `plugins {
  id("androidx.baselineprofile")
}

dependencies {
  baselineProfile(project(":baselineprofile"))
  // Installs the profile on devices that do not do it at install time.
  implementation("androidx.profileinstaller:profileinstaller:1.4.1")
}

baselineProfile {
  // A managed device keeps CI deterministic — a shared physical device
  // under load produces a profile shaped by whatever else was running.
  useConnectedDevices = false
}`,
        },
      },
      { type: "h2", text: "Startup profiles, and why DEX layout matters" },
      {
        type: "p",
        text: "There is a second, less discussed half to this. Marking the same rule as a startup profile lets R8 reorder classes across DEX files so everything needed during launch lands in the first file, in roughly the order it is touched. Fewer page faults, less I/O, and it costs one line.",
      },
      {
        type: "code",
        snippet: {
          title: "app/build.gradle.kts",
          language: "groovy",
          code: `android {
  buildTypes {
    release {
      isMinifyEnabled = true
      // Let R8 lay out DEX using the startup profile.
      experimentalProperties["android.experimental.art-profile-r8-rewriting"] = true
    }
  }
}`,
        },
      },
      { type: "h2", text: "What to expect" },
      {
        type: "p",
        text: "Results vary more than any blog post will admit. The effect is largest where it matters most: cheap devices with slow storage, which are exactly the devices that were already slowest. A representative shape of result, measured on a mid-range device running a minified release build, 15 iterations:",
      },
      {
        type: "table",
        caption: "Cold start to full display — same build, same device, compilation mode varied",
        head: ["Compilation mode", "Median", "P90"],
        rows: [
          ["None (fresh install, interpreted)", "— baseline —", "— baseline —"],
          ["Partial with Baseline Profile", "noticeably lower", "lower by more than the median"],
        ],
      },
      {
        type: "note",
        tone: "tip",
        title: "Report your own numbers, not someone else's",
        text: "The table above is deliberately shaped rather than specific. Run the two benchmarks above on the device class your users actually hold and quote that. A figure from another app on another phone is marketing, not measurement.",
      },
      { type: "h2", text: "Keeping it honest over time" },
      {
        type: "list",
        items: [
          "Regenerate when startup code changes meaningfully. A stale profile is not harmful, just progressively less useful.",
          "Check the profile is installed in release: ProfileVerifier reports the status at runtime, and it is worth logging once in an internal build.",
          "Watch for the profile silently not being packaged. A build that strips it fails quietly — your benchmark with BaselineProfileMode.Require will catch it, which is the reason to use Require rather than Enable.",
          "Do not stop here. A profile makes existing work faster; it does not remove work. Deferred initialisation, a leaner Application.onCreate and fewer content providers at startup all still apply.",
        ],
      },
    ],
    takeaways: [
      "Without a profile, a freshly installed app runs interpreted — the user pays for the JIT's warm-up.",
      "Measure with Macrobenchmark in CompilationMode.None vs Partial(Require); anything else is guesswork.",
      "Wait for real content in both the benchmark and the generator; a splash screen will flatter you.",
      "Add the startup profile and R8 DEX rewriting — same input, extra win, one line.",
      "Gains are largest on low-end devices, which is where startup was worst to begin with.",
    ],
  },

  /* ───────────────────────────── 03 ───────────────────────────── */
  {
    slug: "compose-recomposition-jank",
    title: "The recomposition you cannot see",
    excerpt:
      "Strong skipping removed a whole class of Compose performance bugs. It also made the remaining ones harder to find. A practical method for locating what still recomposes, and why.",
    category: "Deep dive",
    date: "2026-04-21",
    readingMinutes: 10,
    tags: ["Jetpack Compose", "Performance", "Stability", "Kotlin"],
    question: "My list drops frames while scrolling, but nothing in the code looks obviously wrong. What now?",
    body: [
      {
        type: "p",
        text: "Compose redraws by recomposing — calling your composable functions again and keeping what did not change. When it works, it is invisible. When it does not, you get a list that stutters on a device that should have no trouble, and a profiler trace that is a wall of composable names with no obvious culprit.",
      },
      {
        type: "p",
        text: "Strong skipping, on by default since the Kotlin 2.0 Compose compiler, changed the baseline. Composables with unstable parameters now skip anyway, comparing those parameters by instance. That removed most of the old unstable-parameter cases — and left a smaller set of problems that are genuinely about what your state does, not what type it has.",
      },
      { type: "h2", text: "Step one: find out what is recomposing" },
      {
        type: "p",
        text: "Do not guess. Layout Inspector shows recomposition counts per composable in a running debug build, and it is the fastest way to turn a vague feeling into a number. A row that recomposes once per frame while you scroll is the one to look at — not the one you suspected.",
      },
      {
        type: "p",
        text: "For something you can keep in version control, the compiler will tell you which composables it considers skippable and which it does not.",
      },
      {
        type: "code",
        snippet: {
          title: "app/build.gradle.kts",
          language: "groovy",
          code: `composeCompiler {
  // Writes <module>-composables.txt and <module>-classes.txt:
  // per-composable skippability, and per-class stability inference.
  reportsDestination = layout.buildDirectory.dir("compose_reports")
  metricsDestination = layout.buildDirectory.dir("compose_metrics")
}`,
        },
      },
      {
        type: "note",
        tone: "warn",
        title: "Measure in a release build",
        text: "Debug builds leave Compose instrumentation in place and run without R8. Scrolling that janks in debug and is perfectly smooth in release is extremely common, and chasing it wastes an afternoon. Confirm the problem exists in a minified release build before optimising anything.",
      },
      { type: "h2", text: "The cause that survives strong skipping: unstable reads" },
      {
        type: "p",
        text: "Strong skipping compares parameters by instance. That helps when a parameter is the same object each time, and does nothing when you create a new one on every composition. A lambda capturing a changing value, a list copied in the composable body, a derived object built inline — each is a fresh instance, each defeats the comparison.",
      },
      {
        type: "code",
        snippet: {
          title: "Before — a new object every composition",
          language: "kotlin",
          code: `@Composable
fun MessageList(state: InboxState, onArchive: (String) -> Unit) {
  // Sorting here runs on every recomposition of MessageList, and hands
  // every row a brand-new list instance each time.
  val sorted = state.messages.sortedByDescending { it.sentAt }

  LazyColumn {
    items(sorted) { message ->
      MessageRow(
        message = message,
        // A new lambda instance per item, per composition.
        onArchive = { onArchive(message.id) },
      )
    }
  }
}`,
        },
      },
      {
        type: "p",
        text: "The fix is not to sprinkle remember everywhere. It is to be deliberate about where derived values come from. Sorting belongs in the ViewModel, where it happens when the data changes rather than when the UI redraws. The key on items lets Compose match rows across updates instead of re-composing from position.",
      },
      {
        type: "code",
        snippet: {
          title: "After — derive once, key the rows",
          language: "kotlin",
          code: `// ViewModel: the sort happens when messages change, not when the UI draws.
val uiState: StateFlow<InboxState> = repository.messages
  .map { messages -> InboxState(messages.sortedByDescending(Message::sentAt)) }
  .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), InboxState.Empty)

@Composable
fun MessageList(state: InboxState, onArchive: (String) -> Unit) {
  LazyColumn {
    items(state.messages, key = { it.id }) { message ->
      MessageRow(message = message, onArchive = onArchive)
    }
  }
}

@Composable
private fun MessageRow(message: Message, onArchive: (String) -> Unit) {
  // Pass the id at the call site instead of capturing it in a new lambda.
  SwipeToDismissBox(onDismissed = { onArchive(message.id) }) { /* ... */ }
}`,
        },
      },
      { type: "h2", text: "The cause nobody looks for: reading state too early" },
      {
        type: "p",
        text: "This is the one that produces the worst jank and the least obvious traces. Reading a frequently changing State in the composition phase invalidates composition on every change. Reading it in layout or draw instead invalidates only that phase — which, for scroll offset or animation progress, is the difference between a smooth list and a slideshow.",
      },
      {
        type: "code",
        snippet: {
          title: "Phase matters more than the value",
          language: "kotlin",
          code: `// Recomposes this composable on every scroll pixel.
val offset = scrollState.firstVisibleItemScrollOffset
Header(modifier = Modifier.offset(y = -(offset / 2).dp))

// Same visual result; the lambda is read in the layout phase, so
// scrolling never invalidates composition.
Header(
  modifier = Modifier.offset {
    IntOffset(x = 0, y = -scrollState.firstVisibleItemScrollOffset / 2)
  }
)`,
        },
      },
      {
        type: "p",
        text: "The same logic drives derivedStateOf. If state changes often but the thing you care about changes rarely — a boolean for whether a scroll-to-top button should be visible, say — derive it, so recomposition happens on the boolean flipping rather than on every pixel.",
      },
      {
        type: "code",
        snippet: {
          title: "Derive the thing that actually changes",
          language: "kotlin",
          code: `val showScrollToTop by remember {
  // Fires twice across an entire scroll, not once per frame.
  derivedStateOf { listState.firstVisibleItemIndex > 4 }
}`,
        },
      },
      {
        type: "note",
        tone: "tip",
        title: "derivedStateOf is not a general-purpose cache",
        text: "It earns its keep only when the input changes far more often than the output. Wrapping a value that changes at the same rate as its source adds an allocation and a layer of indirection for nothing.",
      },
      { type: "h2", text: "When stability really is the problem" },
      {
        type: "p",
        text: "Strong skipping made stability less critical, not irrelevant. A class from a module without the Compose compiler — a networking model, something from a pure Kotlin library — is still inferred unstable, and instance comparison only saves you while the instance is the same. Where the type is yours, mark it. Where it is not, map it to something that is.",
      },
      {
        type: "code",
        snippet: {
          title: "Stability where it is worth stating",
          language: "kotlin",
          code: `// List<T> is an interface — the compiler cannot prove the runtime type
// is immutable, so a data class holding one is inferred unstable.
@Immutable
data class InboxState(val messages: List<Message> = emptyList())

// For types you do not own, declare it once instead of at every call site.
// stability_config.conf, referenced from composeCompiler { }
// com.squareup.moshi.*
// java.time.Instant`,
        },
      },
      { type: "h2", text: "The order to work in" },
      {
        type: "list",
        ordered: true,
        items: [
          "Reproduce in a minified release build. Half of reported Compose jank does not survive this step.",
          "Use Layout Inspector recomposition counts to find which composable is actually hot.",
          "Check whether the hot composable reads a rapidly changing State during composition. Move the read to layout or draw if so — this is usually the whole bug.",
          "Look for objects created in the composable body: sorted or filtered lists, lambdas capturing locals, inline-built models. Lift them to the ViewModel or remember them.",
          "Add key to every lazy list that can reorder or have items removed.",
          "Only then look at stability reports. After the first four steps there is often nothing left to fix.",
        ],
      },
    ],
    takeaways: [
      "Strong skipping removed most unstable-parameter bugs; what is left is about what your state does.",
      "Profile in a minified release build — debug jank is frequently an artefact of the build type.",
      "The biggest remaining cause is reading fast-changing state during composition instead of layout or draw.",
      "Derive values in the ViewModel, not in the composable body; a new list or lambda per composition defeats skipping.",
      "Reach for stability annotations last. By then the problem is usually already gone.",
    ],
  },

  /* ───────────────────────────── 04 ───────────────────────────── */
  {
    slug: "mediastore-at-scale",
    title: "Fifty thousand photos, and a grid that still scrolls",
    excerpt:
      "Querying MediaStore is easy. Querying it for a device with a decade of photos on it, without blocking the main thread or exhausting memory, takes a different shape of code.",
    category: "Problem → Solution",
    date: "2026-02-09",
    readingMinutes: 9,
    tags: ["MediaStore", "Paging", "Coroutines", "Scoped Storage"],
    question: "The gallery takes seconds to open on devices with large libraries. How do I load media lazily?",
    featured: true,
    body: [
      {
        type: "p",
        text: "The MediaStore sample everyone starts from queries every row, maps it into a list of model objects, and hands that list to an adapter. On a test device with four hundred photos it is instant. On a real device with fifty thousand, it allocates fifty thousand objects before showing anything, and the first frame arrives long after the user has decided the app is broken.",
      },
      {
        type: "p",
        text: "Two things are wrong, and they are worth separating. The query itself is fast — the content provider is backed by an indexed database. What is slow is materialising every row up front, and doing anything per-row on the main thread.",
      },
      { type: "h2", text: "Ask for less" },
      {
        type: "p",
        text: "Every column in your projection is data copied across a binder boundary into a CursorWindow. A grid cell needs an id, a size for the aspect ratio, and a timestamp to group by. It does not need the display name, the path, the MIME type, or anything else you added because it seemed useful.",
      },
      {
        type: "code",
        snippet: {
          title: "MediaQuery.kt",
          language: "kotlin",
          code: `private val PROJECTION = arrayOf(
  MediaStore.Files.FileColumns._ID,
  MediaStore.Files.FileColumns.MEDIA_TYPE,
  MediaStore.Files.FileColumns.DATE_MODIFIED,
  MediaStore.Files.FileColumns.WIDTH,
  MediaStore.Files.FileColumns.HEIGHT,
)

// One query for images and videos together. Two queries plus a merge
// is a sort you do not need to perform yourself.
private const val SELECTION =
  "\${MediaStore.Files.FileColumns.MEDIA_TYPE} IN (?, ?)"

private val SELECTION_ARGS = arrayOf(
  MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE.toString(),
  MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO.toString(),
)`,
        },
      },
      { type: "h2", text: "Page at the provider, not in memory" },
      {
        type: "p",
        text: "Loading everything and paging the list afterwards still pays the full cost. Since API 30 the query bundle accepts limit and offset, which pushes paging down to SQLite where it belongs. The code below reads one page and nothing more.",
      },
      {
        type: "code",
        snippet: {
          title: "MediaPagingSource.kt",
          language: "kotlin",
          code: `class MediaPagingSource(
  private val resolver: ContentResolver,
) : PagingSource<Int, MediaItem>() {

  override suspend fun load(params: LoadParams<Int>): LoadResult<Int, MediaItem> =
    withContext(Dispatchers.IO) {
      val offset = params.key ?: 0
      val args = bundleOf(
        ContentResolver.QUERY_ARG_SQL_SELECTION to SELECTION,
        ContentResolver.QUERY_ARG_SQL_SELECTION_ARGS to SELECTION_ARGS,
        ContentResolver.QUERY_ARG_SQL_SORT_ORDER to
          "\${MediaStore.Files.FileColumns.DATE_MODIFIED} DESC",
        ContentResolver.QUERY_ARG_LIMIT to params.loadSize,
        ContentResolver.QUERY_ARG_OFFSET to offset,
      )

      runCatching {
        resolver.query(CONTENT_URI, PROJECTION, args, null)
          .use { cursor -> cursor?.toMediaItems().orEmpty() }
      }.fold(
        onSuccess = { items ->
          LoadResult.Page(
            data = items,
            prevKey = if (offset == 0) null else offset - params.loadSize,
            nextKey = if (items.size < params.loadSize) null else offset + items.size,
          )
        },
        // A revoked permission mid-scroll throws rather than returning empty.
        onFailure = { LoadResult.Error(it) },
      )
    }

  override fun getRefreshKey(state: PagingState<Int, MediaItem>): Int? =
    state.anchorPosition?.let { state.closestPageToPosition(it)?.prevKey }
}`,
        },
      },
      {
        type: "p",
        text: "Resolve column indices once outside the row loop. Calling getColumnIndexOrThrow per row is a string lookup per row per column, which on fifty thousand rows is real time spent for no reason.",
      },
      {
        type: "code",
        snippet: {
          title: "Cursor mapping",
          language: "kotlin",
          code: `private fun Cursor.toMediaItems(): List<MediaItem> {
  val idCol = getColumnIndexOrThrow(MediaStore.Files.FileColumns._ID)
  val typeCol = getColumnIndexOrThrow(MediaStore.Files.FileColumns.MEDIA_TYPE)
  val widthCol = getColumnIndexOrThrow(MediaStore.Files.FileColumns.WIDTH)
  val heightCol = getColumnIndexOrThrow(MediaStore.Files.FileColumns.HEIGHT)

  return buildList(count) {
    while (moveToNext()) {
      val id = getLong(idCol)
      add(
        MediaItem(
          // Build the content URI; never hand a file path to the loader.
          uri = ContentUris.withAppendedId(CONTENT_URI, id),
          isVideo = getInt(typeCol) == MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO,
          width = getInt(widthCol),
          height = getInt(heightCol),
        )
      )
    }
  }
}`,
        },
      },
      {
        type: "note",
        tone: "warn",
        title: "DATA is not a path you can use",
        text: "The FileColumns.DATA column still exists and still looks like an absolute path. Under scoped storage you usually cannot open it directly, and on some devices it is stale. Use content URIs via ContentUris.withAppendedId and let the system resolve them.",
      },
      { type: "h2", text: "Thumbnails: let the system do it" },
      {
        type: "p",
        text: "Decoding a full twelve-megapixel JPEG to fill a 150dp cell is the other half of the problem. loadThumbnail asks the provider for a thumbnail at the size you want, which on most devices is served from a cache rather than decoded at all.",
      },
      {
        type: "code",
        snippet: {
          title: "Thumbnails",
          language: "kotlin",
          code: `suspend fun thumbnail(uri: Uri, size: Int): Bitmap? = withContext(Dispatchers.IO) {
  runCatching {
    resolver.loadThumbnail(uri, Size(size, size), null)
  }.getOrNull() // A deleted item between query and load is normal, not exceptional.
}`,
        },
      },
      { type: "h2", text: "Staying correct while the library changes underneath you" },
      {
        type: "p",
        text: "Photos arrive while your grid is open. A ContentObserver tells you when, and invalidating the PagingSource is the whole response — Paging reloads the pages that are visible and leaves the rest alone.",
      },
      {
        type: "code",
        snippet: {
          title: "Invalidate on change",
          language: "kotlin",
          code: `val pager = Pager(
  config = PagingConfig(pageSize = 120, enablePlaceholders = true),
) { MediaPagingSource(resolver).also { current = it } }

private val observer = object : ContentObserver(Handler(Looper.getMainLooper())) {
  override fun onChange(selfChange: Boolean) { current?.invalidate() }
}

resolver.registerContentObserver(CONTENT_URI, true, observer)`,
        },
      },
      {
        type: "note",
        tone: "tip",
        title: "If you only need the user to pick a file, stop here",
        text: "All of the above is for an app that browses the library. If your app just needs one photo, the Photo Picker gives you that with no permission at all, and no code to maintain. Reading the whole library is a big ask of a user, and the permission dialog reflects that.",
      },
      { type: "h2", text: "What actually moved the needle" },
      {
        type: "list",
        items: [
          "Provider-side limit and offset — the single biggest change, because nothing else matters if you still materialise every row.",
          "A five-column projection instead of everything, which shrinks every CursorWindow transfer.",
          "Column indices hoisted out of the row loop.",
          "loadThumbnail rather than decoding originals.",
          "enablePlaceholders so the scrollbar is the right size immediately and the grid does not jump as pages land.",
        ],
      },
    ],
    takeaways: [
      "Page inside the ContentResolver query with QUERY_ARG_LIMIT and QUERY_ARG_OFFSET; paging in memory pays the full cost anyway.",
      "Project only the columns a cell needs — every extra one is copied across a binder boundary.",
      "Resolve column indices once, not per row.",
      "Use content URIs and loadThumbnail; FileColumns.DATA is unreliable under scoped storage.",
      "Invalidate the PagingSource from a ContentObserver instead of reloading the screen.",
      "If you only need a file picked, use the Photo Picker and skip the permission entirely.",
    ],
  },

  /* ───────────────────────────── 05 ───────────────────────────── */
  {
    slug: "offline-first-sync",
    title: "A sync engine that assumes the network will fail",
    excerpt:
      "Offline-first is less about caching than about deciding, in advance, what happens when the same record changes in two places. The queue, the conflict rule, and the parts that bite later.",
    category: "Deep dive",
    date: "2025-12-15",
    readingMinutes: 11,
    tags: ["Room", "WorkManager", "Coroutines", "Architecture"],
    question: "How do I make writes work offline without losing or duplicating them when the network returns?",
    body: [
      {
        type: "p",
        text: "Most apps described as offline-first are really offline-readable: they cache responses, show them when the network is down, and quietly fail any write. That is a reasonable product decision, but it is a different thing, and the gap is where the hard problems live. The moment a user can change something while offline, you have a distributed system with two writers and no coordinator.",
      },
      { type: "h2", text: "The local database is the source of truth" },
      {
        type: "p",
        text: "The structural decision that makes everything else tractable: the UI reads only from Room, never from the network. The network is a background process that reconciles the local database with the server. This means a write is instant from the user's point of view, and it means there is exactly one place the UI gets data from — so there is no state where the screen shows something the database disagrees with.",
      },
      {
        type: "code",
        snippet: {
          title: "MessageDao.kt",
          language: "kotlin",
          code: `@Dao
interface MessageDao {
  // The UI collects this and nothing else. Sync writes to the same table.
  @Query("SELECT * FROM messages WHERE threadId = :threadId ORDER BY sentAt DESC")
  fun observeThread(threadId: String): Flow<List<MessageEntity>>

  @Upsert
  suspend fun upsertAll(messages: List<MessageEntity>)

  @Query("SELECT * FROM outbox ORDER BY createdAt ASC LIMIT :limit")
  suspend fun pendingOperations(limit: Int): List<OutboxEntity>
}`,
        },
      },
      { type: "h2", text: "Writes go to an outbox, not to the network" },
      {
        type: "p",
        text: "A local write does two things in one transaction: it updates the visible table, and it appends an intent to an outbox. Both or neither — if the process dies between them, you either have an unsent change with no record of it or a queued operation that never happened on screen.",
      },
      {
        type: "code",
        snippet: {
          title: "MessageRepository.kt",
          language: "kotlin",
          code: `suspend fun send(threadId: String, body: String) {
  val message = MessageEntity(
    // Client-generated id: the row has a stable identity before the
    // server has ever heard of it, which is what makes retry safe.
    id = UUID.randomUUID().toString(),
    threadId = threadId,
    body = body,
    sentAt = clock.now(),
    status = Status.Pending,
  )

  db.withTransaction {
    messageDao.upsertAll(listOf(message))
    outboxDao.enqueue(OutboxEntity(operation = Operation.SendMessage, payloadId = message.id))
  }

  syncScheduler.requestSync()
}`,
        },
      },
      {
        type: "note",
        tone: "tip",
        title: "Client-generated ids are the cheapest idempotency you will ever buy",
        text: "If the id comes from the server, a retry after a response that was sent but never received creates a duplicate. If the client generates it and the server upserts on it, the same request can be delivered any number of times and the result is identical.",
      },
      { type: "h2", text: "WorkManager owns the retry policy" },
      {
        type: "p",
        text: "The temptation is to retry in a coroutine with a loop and a delay. It works until the process is killed, which on modern Android is quickly and often. WorkManager persists the request across process death and reboot, and applies backoff without you writing it.",
      },
      {
        type: "code",
        snippet: {
          title: "SyncScheduler.kt",
          language: "kotlin",
          code: `fun requestSync() {
  val request = OneTimeWorkRequestBuilder<SyncWorker>()
    .setConstraints(
      Constraints.Builder()
        .setRequiredNetworkType(NetworkType.CONNECTED)
        .build()
    )
    .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
    .build()

  // KEEP, not REPLACE: three rapid sends should coalesce into one run,
  // not cancel and restart the sync that is already in flight.
  workManager.enqueueUniqueWork("sync", ExistingWorkPolicy.KEEP, request)
}`,
        },
      },
      {
        type: "code",
        snippet: {
          title: "SyncWorker.kt",
          language: "kotlin",
          code: `override suspend fun doWork(): Result {
  val pending = outboxDao.pendingOperations(limit = 50)

  for (operation in pending) {
    when (val outcome = api.execute(operation)) {
      is Outcome.Success -> db.withTransaction {
        messageDao.markSent(operation.payloadId, outcome.serverTimestamp)
        outboxDao.delete(operation.id)
      }
      // Transient: stop here and let backoff handle it. Carrying on would
      // reorder operations the user performed in sequence.
      is Outcome.Transient -> return Result.retry()
      // Permanent: a 4xx will fail identically forever. Drop it, surface it.
      is Outcome.Permanent -> db.withTransaction {
        messageDao.markFailed(operation.payloadId, outcome.reason)
        outboxDao.delete(operation.id)
      }
    }
  }
  return Result.success()
}`,
        },
      },
      {
        type: "note",
        tone: "warn",
        title: "Distinguish transient from permanent, or you will loop forever",
        text: "A 503 and a 422 both throw. Retrying the 503 is correct; retrying the 422 burns battery until the backoff ceiling and never succeeds. Mapping HTTP status to one of these two outcomes is the single most important piece of error handling in the whole engine.",
      },
      { type: "h2", text: "Conflicts: decide the rule before you need it" },
      {
        type: "p",
        text: "Two devices edit the same record offline. Both sync. Something has to lose, and the only bad answer is not having decided. The usual options, in increasing order of effort:",
      },
      {
        type: "table",
        caption: "Conflict strategies and what they cost",
        head: ["Strategy", "Good for", "The catch"],
        rows: [
          [
            "Last write wins, by server clock",
            "Settings, flags, anything single-field",
            "Silently discards the other edit. Device clocks differ; trust the server's.",
          ],
          [
            "Server authoritative",
            "Data the client only ever appends to",
            "Local edits can vanish without explanation unless you surface it.",
          ],
          [
            "Field-level merge",
            "Records where fields are independent",
            "Needs per-field timestamps — meaningfully more schema and code.",
          ],
          [
            "Ask the user",
            "Documents, anything irreplaceable",
            "Real UI work, and most conflicts are not worth interrupting someone for.",
          ],
        ],
      },
      {
        type: "p",
        text: "Pick per entity rather than globally. A read receipt and a draft document do not deserve the same ceremony — last-write-wins is right for one and unacceptable for the other.",
      },
      { type: "h2", text: "Pulling changes without re-downloading everything" },
      {
        type: "p",
        text: "The other direction needs a cursor. Persist the server's watermark, send it on the next pull, and apply what comes back in one transaction so the UI never observes a half-applied batch.",
      },
      {
        type: "code",
        snippet: {
          title: "Delta pull",
          language: "kotlin",
          code: `private suspend fun pull() {
  var cursor = syncStateDao.cursor()
  do {
    val page = api.changesSince(cursor)
    db.withTransaction {
      messageDao.upsertAll(page.changed.map(MessageDto::toEntity))
      messageDao.deleteByIds(page.deletedIds)
      // Advance the cursor in the same transaction as the data it covers,
      // or a crash here re-downloads or, worse, skips a page.
      syncStateDao.setCursor(page.nextCursor)
    }
    cursor = page.nextCursor
  } while (page.hasMore)
}`,
        },
      },
      { type: "h2", text: "The parts that bite later" },
      {
        type: "list",
        items: [
          "Clock skew. Never order events by the device clock. Use the server's timestamp, or a monotonic counter the server issues.",
          "Unbounded outbox growth. A user offline for a week on a chat screen can queue thousands of operations. Cap it, or collapse superseded operations — ten edits to the same draft are one write.",
          "Tombstones. Deleting a row locally is not enough; without a deletion record, the next pull helpfully restores it.",
          "Partial failure in a batch. Operation twelve of fifty failing should not roll back the eleven that succeeded, which is why each one commits in its own transaction above.",
          "Testing. The interesting cases are all timing: kill the process mid-sync, sync on a connection that drops halfway, run two devices against one account. A fake API that returns Transient on demand is worth more than any number of unit tests over the happy path.",
        ],
      },
      {
        type: "p",
        text: "None of this is exotic, and that is rather the point. The engine is a queue, a retry policy, a conflict rule and a cursor. What makes it hard is that every one of those four has to be decided deliberately — and the cost of deciding any of them late is a migration on data that is already on users' devices.",
      },
    ],
    takeaways: [
      "The UI reads from the local database only; the network reconciles in the background.",
      "A write updates the visible table and appends to an outbox in one transaction — both or neither.",
      "Client-generated ids plus server-side upsert make retries idempotent for free.",
      "Let WorkManager own retry and backoff; a coroutine loop dies with the process.",
      "Separate transient from permanent failures, or you retry a 4xx forever.",
      "Choose a conflict strategy per entity, and choose it before shipping, not after the first report.",
    ],
  },
];

/** Newest first — the order every surface uses. */
export const sortedPosts: Post[] = [...posts].sort((a, b) => b.date.localeCompare(a.date));

export const featuredPosts: Post[] = sortedPosts.filter((p) => p.featured);

export const getPost = (slug: string): Post | undefined => posts.find((p) => p.slug === slug);

/** "9 Feb 2026" — stable across locales, since the export is prerendered. */
export const formatPostDate = (iso: string): string =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
