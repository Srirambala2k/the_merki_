# The Merki

A scroll-driven, auto-playing brand site: eight scenes, each a still background plate with cut-out objects that fly in and
settle as you scroll (or as autoplay scrolls for you), then dissolve into the next scene.

**Stack:** Vite, React 19, TypeScript, Tailwind CSS v4, GSAP (ScrollTrigger). Fonts are self-hosted via Fontsource.

## Run it

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm build        # type-check + production build into dist/
pnpm test         # unit tests (Vitest)
pnpm lint         # Oxlint
```

Useful URL switches: `/?autoplay=0` turns autoplay off; `/?motion=full` ignores the OS "reduce motion" setting.

## How it works

| Where | What |
|---|---|
| `src/content.ts` | All copy, links, the WhatsApp number and per-scene messages. Edit text here. |
| `src/pages.config.ts` | Scene order, which artwork each scene uses, layer groups, depth and the recomposed Process planet. |
| `src/lib/choreography.ts` | Where each object starts and how it arrives (scroll windows and poses). |
| `src/lib/schedule.ts` | Where each scene sits on the one page-long scroll timeline. |
| `src/lib/ambient.ts` | Always-on motion (zoom, background drift, parallax) and autoplay timings. |
| `src/hooks/useMasterTimeline.ts` | The single scrubbed GSAP timeline: objects, copy, dissolves, the Process orb. |
| `src/hooks/useAutoplay.ts` | Scrolls the page by itself; any wheel, touch or key press takes over. |
| `src/hooks/useAmbient.ts` | Zoom, background drift and mouse parallax. |
| `src/components/` | `Stage` and `Scene` (artwork), `Copy` (each scene's words), `Brand` (header, HUD, enquiry), `Overlays` (contact and work panels). |
| `src/merki.css` | Layout and type for the copy. |

## Artwork pipeline

The cut-out objects are produced from the original scene renders, which are **not** in this repository. They were
placed next to the project as `ref_image/` (one clean background plus one image per added object, per page).

```bash
# 1. cut each object out by subtracting its clean background (needs Python with Pillow, NumPy, SciPy)
python -I tools/build_layers.py ../ref_image ../ref_image_4k assets-src
# 2. turn the 4K sources into responsive AVIF/WebP and regenerate src/slides.generated.ts
node scripts/optimize.mjs
```

`tools/layers.json` holds the per-object cut-out settings. The optimised images in `public/img/` and the generated
`src/slides.generated.ts` are committed, so the site runs without re-running the pipeline.

`scripts/` also holds the Playwright helpers used to check the build (screenshots, frame-rate and autoplay probes).
Playwright and its browser are dev-only: `pnpm exec playwright install chromium`.
