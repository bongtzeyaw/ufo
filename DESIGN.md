# Design system

Reference for the site's visual identity, decided in the 2026-08 branding pass.
Where this document and the code disagree, **`site/css/style.css` is canonical**
for values — update both in the same change.

## Identity

Direction: **"Product"** — a clean, conventional data-app look serving the
project's north star (a neutral, citable reference resource; see ROADMAP.md).
Two theme variants form a pair:

- **Cobalt** (dark, default): blue-biased near-black neutrals, cobalt accent.
- **Daylight** (light): white chrome, pale desaturated map, deepened blue accent.

The map is the product; chrome stays quiet, one accent family, no decoration.

## How theming works

- An inline script in the `<head>` of `site/index.html` stamps
  `<html data-theme="dark|light">` **before first paint**: it reads a
  `localStorage.theme` override first, else falls back to
  `prefers-color-scheme`. The toggle button (wired in `app.js`) flips the
  attribute and persists the choice.
- `style.css` defines all colors as custom properties: the dark palette on
  `:root`, the light palette on `:root[data-theme="light"]`. There is
  deliberately **no `@media (prefers-color-scheme)` block** — the stamped
  attribute is the single source of truth, so CSS and JS can never disagree.
- Color lives in **three places**; a new theme-dependent color must be handled
  in each that applies:
  1. CSS tokens (both blocks) in `style.css`;
  2. the `THEME` map at the top of `site/js/app.js` — Leaflet draws tiles and
     markers outside CSS reach (tiles: CARTO `dark_all` / `light_all`; bubble
     fill; marker ring color). On toggle, existing markers are restyled in
     place via `bubbleLayer.eachLayer(...setStyle)` — never by calling
     `render()`, which would close the open panel and unpin the circle;
  3. the two logo PNGs (see Brand assets).

## Color tokens

### Cobalt (dark, `:root`)

| Token | Value | Role |
|---|---|---|
| `--bg` | `#0f1115` | page background |
| `--surface` | `#14171d` | topbar, rail, panel, legend, shelf |
| `--surface-2` | `#1b1f27` | cards, inputs, hover fills |
| `--border` | `#262c37` | hairlines |
| `--text` | `#e8ebf0` | primary text |
| `--text-2` | `#b6bdc9` | secondary text |
| `--muted` | `#7e8794` | labels, metadata |
| `--accent` | `#4a94ef` | brand blue: links, bubbles, VID badge |
| `--accent-fill` | `rgba(74,148,239,.15)` | badge/tint fills |
| `--accent-soft` | `rgba(74,148,239,.4)` | open-card border |
| `--img` | `#35b389` | IMAGE badge green |
| `--img-fill` | `rgba(53,179,137,.15)` | IMAGE badge fill |
| `--map-bg` | `#0b0d11` | map water behind tiles |
| `--credit-bg` | `rgba(15,17,21,.9)` | footer/attribution backdrop |
| `--shadow` | `0 4px 16px rgba(0,0,0,.3)` | floating chrome |
| `--panel-shadow` | `-12px 0 32px rgba(0,0,0,.4)` | side panel |

### Daylight (light, `:root[data-theme="light"]`)

| Token | Value | Role |
|---|---|---|
| `--bg` | `#f6f7f9` | page background |
| `--surface` | `#ffffff` | topbar, rail, panel, legend, shelf |
| `--surface-2` | `#f1f3f6` | cards, inputs, hover fills |
| `--border` | `#e2e5ea` | hairlines |
| `--text` | `#1c2027` | primary text |
| `--text-2` | `#454c58` | secondary text |
| `--muted` | `#7d8593` | labels, metadata |
| `--accent` | `#2f6fd0` | brand blue (darkened for contrast on white) |
| `--accent-fill` | `rgba(47,111,208,.10)` | badge/tint fills |
| `--accent-soft` | `rgba(47,111,208,.45)` | open-card border |
| `--img` | `#1e8a66` | IMAGE badge green |
| `--img-fill` | `rgba(30,138,102,.10)` | IMAGE badge fill |
| `--map-bg` | `#e9eef4` | map water behind tiles |
| `--credit-bg` | `rgba(255,255,255,.92)` | footer/attribution backdrop |
| `--shadow` | `0 2px 10px rgba(30,40,60,.10)` | floating chrome |
| `--panel-shadow` | `-10px 0 28px rgba(30,40,60,.12)` | side panel |

### JS-side colors (`THEME` in `app.js`)

| Theme | Tiles | Bubble fill | Marker ring |
|---|---|---|---|
| dark | CARTO `dark_all` | `#4a94ef` | `#0f1115` |
| light | CARTO `light_all` | `#2f6fd0` | `#ffffff` |

## Type & shape

- Font: system sans stack (`-apple-system, BlinkMacSystemFont, "Segoe UI",
  Roboto, sans-serif`), base `14px/1.45`.
- Recurring sizes: 15px/600 site title · 15.5px panel title · 13px record
  title · 12.5px controls · 11.5px metadata/tagline · 10.5px uppercase
  rail labels (letter-spacing `.1em`) · 9.5px/700 badges.
- Radii: `--radius` 7px (controls, shelf, legend, toggle) · 8px record cards ·
  9px logo chip (7px mobile) · 6px media embeds · 4px badges · `999px` pills.
- Borders are always 1px `var(--border)`; elevation comes from the two shadow
  tokens, used sparingly (floating chrome over the map, side panel).
- Single responsive breakpoint: `760px` (rail becomes a horizontal wrap bar,
  tagline/legend hidden, logo steps down).

## Component conventions

- **Rail**: filter groups = uppercase muted label above a full-width control;
  summary counts pinned at the foot. Year range is `[from] – [to]` with
  `min-width: 66px` per select (a 4-digit year clips below that).
- **Record cards**: `--surface-2` on 1px border, radius 8; open state swaps the
  border to `--accent-soft`. VID badge = accent tint fill; IMG = green tint
  fill; no badge borders.
- **Map language**: one blue for all bubbles (precision-kind coloring was
  deliberately removed); dashed circle = location precision, hover previews,
  click pins while the panel is open.
- **Leaflet controls** are themed via tokens, including the disabled state:
  `.leaflet-bar a.leaflet-disabled` must be overridden with that exact
  class+class+element specificity, or Leaflet's hardcoded `#f4f4f4` wins.

## Brand assets

- Source logos (AI-generated, opaque backgrounds, 1254×1254):
  `assets/website_logo_{light,dark}_theme.png`. Regenerate web copies from
  these, never upscale the web copies.
- Web copies: `site/assets/logo-{light,dark}.png` — center-cropped to 940px,
  resized to 128×128 (`sips -c 940 940` then `-z 128 128`). 128px covers the
  40px display size up to 3× density.
- Display: 40×40 desktop / 32×32 mobile, rendered as a rounded chip (9px/7px)
  because the PNGs have no alpha channel. Two `<img>` elements are swapped by
  CSS only (`:root[data-theme="light"]` show/hide) so the logo flips in the
  same paint as the tokens — no JS, no wrong-logo flash.
- Brand blues for external work (logo, social images): dark theme
  `#4a94ef → #2456a8`; light theme `#2f6fd0 → #1c4a94` (gradient 135°).
- Favicon: the dark-theme logo (`site/assets/logo-dark.png`), chosen because
  the browser tab bar follows the *browser* theme, not the site toggle — the
  near-black chip reads on both light and dark tab bars, while a white chip
  would glare on dark ones. A theme-adaptive favicon would require an SVG
  mark with an embedded media query (Firefox-only today).
