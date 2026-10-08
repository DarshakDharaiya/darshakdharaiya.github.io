# Darshak Dharaiya — Portfolio

Next.js 16 · React 19 · TypeScript · Tailwind v4 · React Three Fiber · GSAP/Lenis · Motion

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # fully static output
```

## Editing your content (no component changes needed)

| File | What it controls |
| --- | --- |
| `data/avatar.ts` | Navigation portrait and hero loading/error fallback |
| `data/memojiHead.json` | Hero texture and silhouette used to reconstruct the head mesh |
| `data/memojiProfile.json` | Measured side contour and fixed atlas projection coordinates |
| `data/site.ts` | Name, roles, statement, email, location, availability, About bio + metrics, contact copy |
| `data/social.ts` | GitHub / LinkedIn / email links |
| `data/projects.ts` | Featured projects, Play Store stats, case-study chapters (01–10), code snippets, before/after |
| `data/experience.ts` | Experience timeline |
| `data/skills.ts` | Skill categories and depth (`core` / `strong` / `familiar`) |
| `data/resume.ts` | Résumé — composed from the files above; also generates `/resume.pdf` |
| `data/stats.ts` | Achievement numbers — derived automatically from `projects.ts` |
| `data/blog.ts` | Posts — the Writing section, `/blog/[slug]` and the sitemap |

Search for `TODO` to find every placeholder. Set `NEXT_PUBLIC_SITE_URL` in production for correct canonical/OG URLs.
Project images live in `public/projects/<slug>/` (icon + screenshots from the Play Store listings).
Add a case-study video with `caseStudy.video = { src: "/projects/<slug>/demo.mp4" }`.

The hero avatar mounts through `Hero.tsx` → `components/sections/MemojiStage.tsx`.
`public/memoji/poses.webp` contains nine supplied renders, packed and aligned by
`output/build-poses.cjs`; `data/memojiPoses.json` describes their angles and tile indices.
`output/build-head.cjs` extracts its frontal portrait to `public/memoji/head.webp` and
records its silhouette in `data/memojiHead.json`. `output/build-profiles.cjs` fits depth
to the user's side references in `output/poses-src/profile-{right,left}.png`, then packs
the front, right and left colours into one fixed `public/memoji/head-atlas.webp` texture.
Rebuild in that order: `node output/build-head.cjs` then `node output/build-profiles.cjs`.

Movement follows [Redoyanul Haque's reference](https://www.redoyanulhaque.me/): viewport-wide
pointer tracking, a restrained ±30° horizontal turn, ±12° vertical tilt, and more lag
horizontally than vertically. Smoothing uses elapsed time so speed is independent of refresh
rate. Touch swipes turn the head and return to center two seconds after release; vertical
gestures retain page scrolling. Click/tap or Enter nods; arrow keys adjust the view and
Escape, Home or Reset faces forward. Keyboard and Reset retain control until the pointer moves.

`lib/memoji/geometry.ts` reconstructs the skull from the frontal silhouette and measured
side contour, with a forward chin, rounded rear skull and sculpted nose/eye sockets.
Both ears are closed, cupped pinna shells with a raised helix, recessed concha, inner
ridge and tragus. Their anterior roots penetrate the skull while their posterior rims
remain exposed. `lib/memoji/renderer.ts` rotates the whole object using a
perspective camera and fixed UVs. Front/side texture regions and their seam weights are
  attached to vertices; turning never selects images or changes texture blend weights.
Ear skin details from the supplied profiles use local shell coordinates and are
matched to the adjoining cheek tone, with geometry lighting and cavity occlusion.
They never project across the skull. Lateral skin cleanup removes duplicated frontal ears
and preserves the rear hair region; tapered sideburns continue the scalp in front of
each ear. The shader animates upper and lower eyelids and small
gaze movements that lead the head.
`lib/memoji/blink.ts` supplies randomized blinks: 90 ms closing, 35 ms closed, 165 ms
reopening, with occasional double blinks. Tiny resting sway and bob add life.
The geometry and eye coordinates are calibrated to these references; replacing the character
requires recalibration. Differently generated views do not supply complete 3D correspondence,
so this reconstructed head still approximates the supplied appearance;
an original model would provide the exact authored likeness. Body animation and additional
expressions need a full character rig.

Rendering pauses offscreen and in hidden tabs. Reduced motion disables pointer tracking,
resting movement, blinks, gaze, nods and animated transitions; keyboard angle changes remain available.
`public/memoji/avatar.webp` supplies the navigation badge and loading/error fallback,
including when WebGL is unavailable or the context is lost. The background particle scene
has its own canvas and does not render the hero avatar.

## Link previews

Every shareable URL generates its own 1200x630 card at build time from site data:
`/og.png` for the home page, `/blog/<slug>/og.png` per post, `/work/<slug>/og.png` per
case study. Each carries the headline fact set — installs, apps past a million, top
rating — because the preview is what most people see before they decide to click.

Two things are deliberate and easy to undo by accident:

- **They are route handlers (`app/og.png/route.tsx`), not the `opengraph-image` file
  convention.** That convention emits a file with no extension, which GitHub Pages
  serves as `application/octet-stream` — and crawlers reject a preview whose
  Content-Type is not an image. A dotted route segment, the same trick `/resume.pdf`
  already uses, produces a real `.png`. The CI export check asserts the bytes are a PNG.
- **`export const dynamic = "force-static"`** is required on each one, or `output: export`
  refuses to build the route at all.

Artwork lives in `lib/og.tsx`. Satori (behind `ImageResponse`) supports flexbox only, no
CSS variables, so the design tokens are restated there as literals. Avoid glyphs outside
the default font — a star or an emoji makes the build try to fetch a font over the network,
which both fails and makes the build network-dependent.

## Analytics

Off by default, and provider-agnostic. Set both at build time to switch it on:

```bash
NEXT_PUBLIC_ANALYTICS_SRC=https://plausible.io/js/script.js
NEXT_PUBLIC_ANALYTICS_SITE=darshakdharaiya.github.io
```

Leave either unset and no script is emitted. `components/layout/Analytics.tsx` lists
known-good cookieless options (GoatCounter, Plausible, Umami) — all three need no consent
banner. The variables are read at build time because the site is a static export.

## Writing

Posts live in `data/blog.ts` and drive the Writing section, `/blog/[slug]` and the sitemap
entries. Newest-first ordering is computed from `date`, so adding a post is one object and
nothing else — no index to update, no route to register.

Bodies are **structured blocks, not Markdown or MDX**. The rest of the site is already
data-driven TypeScript, and this keeps posts type-checked, free of a parser dependency, and
rendered with the same `CodeBlock` the case studies use. The available blocks are:

| Block | For |
| --- | --- |
| `p` / `h2` / `h3` | Prose and section headings |
| `list` | Bulleted, or `ordered: true` for steps |
| `code` | A `CodeSnippet` — same highlighter as the case studies |
| `note` | A `tip` or `warn` aside |
| `table` | Comparisons; scrolls horizontally on phones |

The in-page chapter nav is generated from the `h2` blocks, so a new section appears there
automatically. Each post also emits `TechArticle` JSON-LD.

> **The posts shipped here are drafts written to fill the section.** They are technically
> accurate as far as they go, but they are published under your name — read them before
> deploying, and replace any benchmark figure with one you have actually measured on your
> own device and build.

## Architecture

```
app/                    routes: /, /blog, /blog/[slug] (SSG), /work/[slug] (SSG),
                        /resume.pdf and /og.png (generated), sitemap, robots
components/
  layout/               ThemeProvider, SmoothScroll (Lenis+GSAP), Navbar, CustomCursor, PageTransition, Footer
  sections/             Hero, Work, About, Experience, Skills, Achievements, Resume, Blog, Contact
  case-study/           ChapterNav, ArchitectureDiagram, CodeBlock
  blog/                 PostBody (block renderer)
  animations/           TextReveal, ScrollHighlight, Reveal, Counter, Parallax
  ui/                   Button (magnetic), Magnetic, TiltCard, SectionHeader, ThemeToggle, Icons
  three/                Scene, Background (lazy), Galaxy, ParticleField, Lights,
                        CameraController, MouseController
data/                   all portfolio content
hooks/                  useMousePosition, useReducedMotion, useScrollProgress, useDevicePerformance, useMediaQuery
lib/                    animation (easing/springs), memoji (portrait renderer),
                        three (store, shaders, galaxy, galaxyShaders, materials), utils, highlight
```

Design tokens (colour, type scale, radius, glass, shadows, easing) live in `app/globals.css`;
motion tokens (springs, durations) in `lib/animation.ts`; 3D material tokens in `lib/three/materials.ts`.

### Theme change

Switching theme plays a Telegram-style circular reveal: the incoming theme is clipped to a
circle growing from the toggle while the outgoing one stays still underneath. It runs on the
View Transitions API, so there are three pieces and they have to agree:

- `ThemeProvider.toggle()` measures the click origin and the exact distance from it to the
  furthest viewport corner, publishing them as `--theme-x`, `--theme-y` and `--theme-r`.
- `html.theme-transition ::view-transition-new(root)` in `globals.css` animates `clip-path`
  between `circle(0)` and `circle(var(--theme-r))`. **Changing the variable names on either
  side silently degrades the effect to an instant swap**, because the sibling rule sets
  `animation: none` on both root snapshots to stop the default crossfade.
- The radius is measured rather than a fixed `150vmax`, so the circle finishes the moment it
  covers the screen instead of ~30% later, and the curve is a decelerate — a wipe that starts
  slowly reads as lag.

It degrades cleanly: browsers without `startViewTransition`, and anyone with
`prefers-reduced-motion: reduce`, get an instant swap. Browsers also skip view transitions
entirely while the document is hidden, which is expected and handled.

### The galaxy

Scrolling flies the camera forward through the dust field. Behind it sits a barred spiral
galaxy, held in the upper-left quadrant clear of the headings, drifting a little closer and
fading back as the page goes on.

It is generated, never downloaded — no texture ships for it. Stars are laid on logarithmic
arms and scattered outward by a cubed random, which is what gives the arms soft edges and
dark lanes between them; a tenth go into a spherical halo so the centre has a bulge rather
than a flat cut-out. Everything that shapes it — arm count, twist, scatter, disc thickness,
halo share, tilt, speed and colours — is `galaxyConfig` in `lib/three/galaxy.ts`, so the
look is retuned there and nowhere else.

A portrait frame is no narrower vertically but much narrower across, so the disc is shrunk
to fit it. The shrink happens in the shader, which leaves the stars their size on screen —
that is what keeps the arm structure legible instead of collapsing it into a blob.

**Light mode is not the dark palette dimmed.** Additive blending cannot darken anything, so
pale stars composited onto a near-white page are mathematically invisible — which is exactly
what used to happen. `galaxyTheme` in `lib/three/galaxy.ts` therefore carries a full palette
*and* a blending mode per theme: dark mode adds light, light mode draws dark stars with
normal blending, so the galaxy reads as ink on paper with the densest region darkest.

Star colours are uniforms, not baked vertex colours. The buffer stores only `aRadius`,
a brightness jitter and a hot-giant flag; the core-to-rim ramp is mixed in the vertex shader.
That is what lets a theme change crossfade the whole galaxy instead of rebuilding its buffer.
Uniforms initialise from the theme that is already applied, so a light-mode visitor never
watches it fade out of the dark palette on first paint.

### Performance notes
- WebGL is code-split and mounts on `requestIdleCallback`, after text has painted.
- One persistent canvas for every route; rendering pauses while the tab is hidden.
- Device tiering sets particle count and background DPR cap;
  `PerformanceMonitor` lowers DPR further if FPS drops.
- Particles + constellation lines are two draw calls, animated entirely in the vertex shader.
- The galaxy is one more draw call. Arms are wound by the vertex shader with differential
  rotation — inner stars orbit faster — so the buffer is static and nothing is uploaded per
  frame. Star count is tiered with the device alongside particle count.
- `prefers-reduced-motion`: no smooth scroll, no parallax, minimal 3D motion, instant transitions.
  The galaxy turns at a fifth speed and stops twinkling.
