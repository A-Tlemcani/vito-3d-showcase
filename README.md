# Trattoria Aurelia: restaurant 3D showcase

A premium restaurant website with a sculpted 3D hero (lathe-turned wine glass, physical materials), a filterable menu, and table reservations with live slot availability.

**Live demo → [https://abdeltl.github.io/restaurant-3d-showcase/](https://abdeltl.github.io/restaurant-3d-showcase/)**

![Screenshot](https://abdeltl.github.io/work/restaurant-3d-showcase.jpg)

## Highlights
- **Cinematic scroll story:** the page opens on a dressed trattoria table and the camera glides through four chapters as you scroll (establishing → lemons on the board → the wine → overhead), with copy that fades in for each chapter.
- **Photoreal assets:** ten CC0 [Poly Haven](https://polyhaven.com/) scanned models (table, brass goblets, wine bottles, oil lamp, lemons, pomegranates…) lit by a real HDRI capture (`comfy_cafe`). Our own lathe-turned wine glasses use physical transmission. The models went from 21 MB to 3.9 MB with meshopt + WebP (`gltf-transform optimize`).
- **Living details:** flickering oil-lamp light, soft shadows, warm fog, pointer parallax. Reduced motion is respected.
- **Menu** with WAI-ARIA tabs and dietary filters; **reservation slot engine** (`src/slots.ts`, unit-tested) with opening hours, a same-day cutoff in Paris time and capacity per party.
- **"For restaurant owners"** section: the sales pitch, covering an on-site scan visit (Gaussian splat of the room), dishes captured by photogrammetry, live booking integration, launch and care.

## Engineering
- **Stack:** Vite 8, TypeScript (strict), Three.js 0.186, no UI framework, with about 140 KB of JS gzipped including Three.js. The 3D chunk is lazy-loaded after first paint.
- **Performance:** device-pixel-ratio capped at 2, render loop paused when the canvas is off-screen or the tab is hidden, `prefers-reduced-motion` honoured.
- **Accessibility:** semantic HTML, native form controls, keyboard support, visible focus, ARIA only where native semantics fall short.
- **Security:** strict CSP (`default-src 'self'`, no inline scripts/styles; `wasm-unsafe-eval` only for the meshopt decoder, `blob:` only for GLB textures), every string rendered via `textContent`, self-hosted fonts (no third-party requests, GDPR-friendly), pinned dependencies with a 14-day Dependabot cooldown, `npm audit` in CI.
- **SEO:** unique title/description, canonical URL, Open Graph, JSON-LD structured data, `robots.txt` and `sitemap.xml`.
- **Architecture:** `slots.ts` (pure, tested) · `menu.ts` (content) · `scene.ts` (3D) · `main.ts` (UI). Replace `occupancy()` with a call to TheFork/Zenchef/your own API to go live.

## Run locally
```bash
npm ci --ignore-scripts
npm run dev      # http://localhost:5173
npm test         # unit tests (node:test)
npm run build    # typecheck + production build in dist/
```

## Deploy
Every push to `main` builds and deploys to GitHub Pages via `.github/workflows/deploy.yml` (Settings → Pages → Source: *GitHub Actions*).

---
Designed & developed by [Abderrahman Tlemcani](https://abdeltl.github.io/). The brand in this demo is fictional.

## Credits
3D models and HDRI: [Poly Haven](https://polyhaven.com/) (CC0).
