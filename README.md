# Vitorio: cucina italiana

A premium restaurant website with a sculpted 3D hero (lathe-turned wine glass, physical materials), a filterable menu, and table reservations with live slot availability.

**Live demo → [https://abdeltl.github.io/vitorio/](https://abdeltl.github.io/vitorio/)**

![Screenshot](https://abdeltl.github.io/work/vitorio.jpg)

## Highlights
- 3D hero: `LatheGeometry` glass with transmission, clearcoated wine and olives under a `RoomEnvironment` light probe, plus pointer parallax and a scroll turntable
- **Menu:** WAI-ARIA tabs with arrow-key navigation and combinable dietary filters (vegetarian, vegan, gluten-free, spicy)
- **Reservation slot engine** (`src/slots.ts`, unit-tested): 15-minute seatings per service, weekly schedule, Monday closure, 2-hour same-day cutoff in Paris time, capacity per party size
- `Restaurant` JSON-LD with opening hours, for Google local results

## Engineering
- **Stack:** Vite 8, TypeScript (strict), Three.js 0.186, no UI framework, with about 140 KB of JS gzipped including Three.js. The 3D chunk is lazy-loaded after first paint.
- **Performance:** device-pixel-ratio capped at 2, render loop paused when the canvas is off-screen or the tab is hidden, `prefers-reduced-motion` honoured.
- **Accessibility:** semantic HTML, native form controls, keyboard support, visible focus, ARIA only where native semantics fall short.
- **Security:** strict CSP (`default-src 'self'`, no inline scripts/styles), every string rendered via `textContent`, self-hosted fonts (no third-party requests, GDPR-friendly), pinned dependencies with a 14-day Dependabot cooldown, `npm audit` in CI.
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
