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
| `data/avatar.ts` | Navigation portrait and optional image poses; colours for the earlier procedural mesh |
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

The hero uses `components/three/FacePortrait.tsx`: a live, closed 3D head inspired by the interaction
in [the Spline Memoji reference](https://my.spline.design/memoji-5ff5893ffef7a1307892703bfdc5aad6/).
`lib/three/portraitGeometry.ts` builds a continuous front and back mesh from the reference
silhouette, with modeled cheek, nose, forehead, quiff and skull depth. Its shape is an artistic
approximation from one image, rather than a recovered original Apple model.
`public/memoji/avatar.webp` preserves the supplied appearance as a projected front texture;
the inferred sides and back have vertex colors. The head follows the pointer, rotates with
mouse drag or horizontal touch swipes, nods on tap/Enter, and supports arrow keys and Reset.
The interaction also follows [Redoyanul Haque's character reference](https://www.redoyanulhaque.me/):
eyes lead the head toward the pointer, rotation settles on a frame-independent spring,
and subtle resting sway and irregular blinks keep the face alive. The Say hello control
triggers a nod and blink; touch rotation returns to neutral after a short pause.
`lib/three/portraitEyeMaterial.ts` animates the supplied irises and eyelids in texture space,
preserving the original open-eye appearance. These expressions are calibrated to this
portrait, not an imported skeletal character or the reference site's authored body animations.
Rotation is bounded to keep the inferred profile natural. An orthographic camera preserves
the portrait proportions and the front material preserves its existing soft shading.
Rendering pauses offscreen or in a hidden tab and respects reduced-motion preferences.
The same portrait supplies the navigation badge and WebGL loading/error fallback.
The earlier directional animation remains in `components/sections/CanvasMemoji.tsx` and
`public/memoji/directions.webp` as an optional alternative.

## Architecture

```
app/                    routes: /, /work/[slug] (SSG), /resume.pdf (generated), sitemap, robots
components/
  layout/               ThemeProvider, SmoothScroll (Lenis+GSAP), Navbar, CustomCursor, PageTransition, Footer
  sections/             Hero, Work, About, Experience, Skills, Achievements, Resume, Contact
  case-study/           ChapterNav, ArchitectureDiagram, CodeBlock
  animations/           TextReveal, ScrollHighlight, Reveal, Counter, Parallax
  ui/                   Button (magnetic), Magnetic, TiltCard, SectionHeader, ThemeToggle, Icons
  three/                Scene, Background (lazy), ParticleField, Avatar, Lights, CameraController, MouseController
data/                   all portfolio content
hooks/                  useMousePosition, useReducedMotion, useScrollProgress, useDevicePerformance, useMediaQuery
lib/                    animation (easing/springs), three (store, shaders, materials, avatar geometry), utils, highlight
```

Design tokens (colour, type scale, radius, glass, shadows, easing) live in `app/globals.css`;
motion tokens (springs, durations) in `lib/animation.ts`; 3D material tokens in `lib/three/materials.ts`.

### Performance notes
- WebGL is code-split and mounts on `requestIdleCallback`, after text has painted.
- One persistent canvas for every route; rendering pauses while the tab is hidden.
- Device tiering sets particle count, DPR cap and avatar mesh detail;
  `PerformanceMonitor` lowers DPR further if FPS drops.
- Particles + constellation lines are two draw calls, animated entirely in the vertex shader.
- `prefers-reduced-motion`: no smooth scroll, no parallax, minimal 3D motion, instant transitions.
