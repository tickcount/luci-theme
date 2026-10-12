# CSS conventions

Style with TailwindCSS v4 `@apply`, using CSS Nesting (`&:hover`, `&[disabled]`, `.parent &`, etc.) for scoped selectors — this is the dominant pattern across every component file. Fall back to raw CSS declarations only when `@apply` can't express the rule: custom properties, `@keyframes`/`animation`/`filter`, `clip-path`, `backdrop-filter`, and inline SVG data-URI backgrounds. The single deliberate exception is `patches/*.css`, plain CSS by design — see [patches.md](patches.md).

## Import order

`main.css` import order is meaningful (later imports win the cascade): `_tokens.css` → `_base.css` → `_layout.css` → `components/_*.css` → `_utilities.css` → `_shared.css`. New component styles get their own `components/_name.css`, imported before `_utilities.css`. Third-party app patches are **not** bundled into `main.css` — they load on demand per page.

Built CSS keeps Tailwind's native `@layer` structure. Theme partials (`_base.css`, `components/*`, `_utilities.css`, …) are plain unlayered CSS — organization comes from the file split, never wrap rules in `@layer`. Unlayered partials outrank Tailwind's layered base/utilities regardless of specificity; the OKLCH tokens already gate browsers to ones with `@layer` support.

## Tokens

- **Token source**: the engine and resolver (operators, `createResolver`, CSS emission helpers) come from `@eamonxg/luci-theme-tokens` (`/engine`, `/emit`); this repo only keeps `tokens/spec.js` (derivations, baked-alpha variants) + `tokens/defaults.js` (input colors). Edit those, then run `pnpm gen:tokens`. Do not edit generated `src/media/_tokens.css` directly.
- **`_tokens.css`**: generated flat custom properties (literal hex inputs, OKLCH for derived/alpha values) for light and dark modes plus the shared `@theme inline` mapping. It is imported by both `main.css` and `login.css`; runtime token-based `color-mix()` and relative `oklch(from …)` are prohibited.
- **Pruning**: `gen-tokens.js` emits only tokens some source reads (`bg-<name>`, `var(--<name>)`, … across `src/` and `ucode/`). Inputs that only feed an alias, and unused alpha variants, never ship. A new `-aNN` utility needs its alpha listed in `ALPHAS` (opaque bases only — the alpha operator replaces a translucent base's alpha).

## Design language

The theme follows ChatGPT's settings UI (captured 2026-10 from chatgpt.com/settings), adapted onto LuCI's markup:

- **Palette** (`tokens/defaults.js`): neutral grays, page `#fcfcfc` / `#000`, ink `#0d0d0d` / `#ededed`, text-tinted fills for hover (5–7%) and soft buttons (5% → 10%), one blue accent (`#3a83f7` / `#006efe`) for focus rings, links and "on" switches.
- **Type**: Geist (UI) and Geist Mono (code), 14/20 body on a 16px root so Tailwind's rem grid is ChatGPT's pixel grid (`h-9` = 36px). Don't put a font size on `html`.
- **Radius**: Tailwind's default ladder is ChatGPT's (6px inputs, 8px nav rows, 12px menu rows, 16px cards/dialogs/menus, full pills for buttons and selects).
- **Mapping**: `.cbi-section` = section title above a bordered card (`.cbi-section-node`); `.cbi-value` = settings row (label + description left, control right, inset hairline dividers; see `_form.css`); flags = switches; selects/dropdowns = selector pills with ChatGPT's menu; page and section tabs = toggle-button pills; meters = the Usage "Weekly limit" bar.
- **Icons** masked from CSS read `--icon-<name>` variables declared once in `_base.css`, so each SVG data URI ships a single time.
- **LuCI's own icons** (`/resources/icons/*`, `/cbi/*`, Tango bitmaps) are swapped for Lucide line icons in `components/_luci-icons.css`: the `<img>` stays, `object-position` hides the original and the `public/outline/icons/luci-*.svg` counterpart paints as its background. Unknown icons are left alone.
- **Charts** follow Usage › Analytics. `components/_charts.css` restyles LuCI's realtime SVG graphs (chart card, 5% grid, palette by series id, dithered area fills from the `#chart-dither` patterns in `header.ut`), turns their legend tables into Analytics' legend (4×40 colour bar, 12px label over an 18px tabular value; the rate's second line stays small via `::first-line`) and turns a tab group whose panes are charts into the "7d / 30d" segmented control. Page patches cover the rest: nlbw's Chart.js doughnuts (`admin-services-nlbw-display.js`), Channel Analysis' per-network colours (`admin-status-channel_analysis.js` swaps `tools.prng.derive_color` for the palette), Statistics' timespan select → segmented control (`admin-statistics-graphs.js`, which presses LuCI's own button), and rrdtool / vnstati PNGs as chart cards (inverted on dark for vnStat).
- **Status**: interface heads and zone badges show state/zone colour as a dot (`_card.css`, `_badge.css`); `.label` is ChatGPT's status pill, and so is app text painted `color:green`/`red` inline ("RUNNING"). The active `.ifacebadge` is a deeper fill, never a blue outline.
- **Chart card**: a realtime chart, its range caption and its legend are drawn as one Analytics card across the three sibling elements (LuCI's sections can hold unrelated content, so the section itself is never the card).
- **Menus** cap at `min(60vh, 24rem)` and scroll, overriding the viewport-height inline `max-height` LuCI computes.
- **Dialogs** are one surface: cards, tables and inputs inside `#modal_overlay > .modal` take the dialog fill, keeping only their hairlines (`_modal.css`).
- **Layout guards**: a settings row keeps ≥40% for its label and lets the control column shrink (`_form.css`); selects cap at `min(100%, 25rem)`; long tab groups wrap on desktop; a card nested in a card is flattened; a view that appends its own heading + table into a form card (Mount Points, vnStat config) is drawn as a separate block (`_card.css`).
- **Content-width breakpoints**: `#maincontent` and `.modal` are size containers. Anything that lays out by the room it actually gets — tables (stacked cards below `@3xl` = 48rem, grid from it), the cell alignment helpers in `_utilities.css`, the package-manager panel, the log filter bars — uses container variants (`@3xl:`, `@max-3xl:`, `@2xl:`), not `md:`. Beside the expanded sidebar a 768–1280px window leaves a phone-sized column; a viewport-keyed grid table there scrolled the whole page sideways. Keep `md:` for the shell itself (sidebar drawer vs rail, header, palette).
- **No sideways scroll**: hidden tooltips stay parked off-screen (`_tooltip.css`) — never give a resting `.cbi-tooltip` a `left`; `#maincontent` wraps unbroken tokens (`break-word`); stacked cells never get narrower than their longest word unless that word is wider than the card.
- **LuCI text icons**: `fonts-glyphs.css` adds a one-glyph face to the Geist family for U+2FFB (the "Clone⿻" button) drawn as Lucide's copy icon; regenerate with `scripts/build-glyph-font.py` (needs fonttools).
- **Type details**: no italics (`em` is secondary ink); textareas, `tt`/`kbd`/`samp` use Geist Mono 13px (LuCI's textareas are code); command output and terminals (`#syslog`, Diagnostics' output, ttyd's iframe via `patches/admin-services-ttyd.css`) sit on the terminal code-block surface.
- **`login.css`**: separate Vite build entry for the login page; it does **not** import `main.css`, but re-imports the generated `_tokens.css`.

## Dark mode

`@custom-variant dark` keyed on `[data-darkmode=true]`, set by an inline script in `header.ut` before paint (reads `localStorage['outline.theme']`) to avoid a flash of the wrong theme.

## Icons, two sources

- `.dev/src/assets/icons/` (Lucide SVGs) are referenced from CSS via the `@assets` alias as `mask-image`/`mask`, so they inherit `currentColor`.
- `.dev/public/outline/icons/` are SVGs referenced directly via `<img>`/JS (sidebar, menu, login, theme toggle) and copied verbatim to `htdocs/luci-static/outline/icons/`.
