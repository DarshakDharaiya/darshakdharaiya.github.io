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

## Architecture

```
app/                    routes: /, /work/[slug] (SSG), /resume.pdf (generated), sitemap, robots
components/
  layout/               ThemeProvider, SmoothScroll (Lenis+GSAP), Navbar, CustomCursor, PageTransition, Footer
  sections/             Hero, Work, About, Experience, Skills, Achievements, Resume, Contact
  case-study/           ChapterNav, ArchitectureDiagram, CodeBlock
  animations/           TextReveal, ScrollHighlight, Reveal, Counter, Parallax
  ui/                   Button (magnetic), Magnetic, TiltCard, SectionHeader, ThemeToggle, Icons
  three/                Scene, Background (lazy), ParticleField, Lights, CameraController, MouseController
data/                   all portfolio content
hooks/                  useMousePosition, useReducedMotion, useScrollProgress, useDevicePerformance, useMediaQuery
lib/                    animation (easing/springs), memoji (portrait renderer), three (store, shaders, materials), utils, highlight
```

Design tokens (colour, type scale, radius, glass, shadows, easing) live in `app/globals.css`;
motion tokens (springs, durations) in `lib/animation.ts`; 3D material tokens in `lib/three/materials.ts`.

### Performance notes
- WebGL is code-split and mounts on `requestIdleCallback`, after text has painted.
- One persistent canvas for every route; rendering pauses while the tab is hidden.
- Device tiering sets particle count and background DPR cap;
  `PerformanceMonitor` lowers DPR further if FPS drops.
- Particles + constellation lines are two draw calls, animated entirely in the vertex shader.
- `prefers-reduced-motion`: no smooth scroll, no parallax, minimal 3D motion, instant transitions.
