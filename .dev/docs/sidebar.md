# Sidebar & menu

- `header.ut`: near-minimal shell — empty `#sidebar` plus a parser-blocking inline script right after it that replays the sidebar cache (below) before first paint; sidebar chrome + nav are otherwise built client-side in `menu-outline.js`.
- `sidebar-outline.js`: state machine for theme (light/dark/device), sidebar collapse/expand, accordion, and mobile drawer — exposed as `window.OutlineSidebar` after the `outline-sidebar-ready` event fires.
- `menu-outline.js`: builds the sidebar chrome after ChatGPT's sidebar — a 52px icon **rail** (logo/home, one button per top-level section, logout at the foot) beside a 238px **panel** (title row: hostname, the command palette's search icon `#cmdk-trigger` bound by `initPalette`, the collapse toggle; then the nav). It resolves the `admin` branch of `ui.menu.load()` into one `.sidebar-accordion-item[data-section]` group per section; the panel shows **one section at a time** (`.is-shown` on the group and its rail button) — the current page's on load, any other picked from the rail without navigating (`sidebar-outline.js`). Collapsed, only the rail stays: a rail button navigates to its section and hovering it lists the section's pages. `ICON_MAP` maps a LuCI menu node's `name` to `/outline/icons/*.svg`; deeper levels render as `#tabmenu`. `syncRoute()` re-marks the active page, rail button and shown section (same longest-link-prefix rule as the header.ut replay), breadcrumb and tabs from `L.env` after a [router](router.md) swap without rebuilding the sidebar; `closeSurfaces()` closes palette/drawer/popover.

## Sidebar cache (anti-flash)

`menu-outline.js` snapshots `#sidebar.innerHTML` + scroll position into `sessionStorage['outline.sidebar.cache']` (`{v, lang, html, scroll}`) after render and on `pagehide`. The `header.ut` inline script replays it pre-paint on the next navigation, recomputes the active highlight for the current URL (longest link-path prefix — keep in sync with menu-outline's dispatchpath matching), restores accordion/scroll state, and sets `data-outline-built` / `data-outline-restored` on `#sidebar`.

When restored, `renderSidebarChrome` only re-syncs the hostname, and `renderSidebarNav` preserves accordion/scroll across its authoritative rebuild.

Restored HTML loses inline JS handlers (`innerHTML` serialization), so anything that must work before the re-render needs a delegated listener — e.g. the logout click in `header.ut`, which clears the cache and sets `window.outlineSuppressSidebarCache` so the `pagehide` re-cache stays suppressed.

**Bump `v` whenever the sidebar markup changes shape.**

The theme captures no view transitions (`components/_view-transitions.css` sets `:root { view-transition-name: none }`); swapped and freshly loaded content fades in instead. On desktop, collapsing eases the rail's width (`_layout.css`) and `#main-wrapper`, a flex-1 sibling, follows it frame by frame: the content is pushed, never snapped and slid back. `sidebar-outline.js` sets `html[data-sidebar-anim]` on the first toggle so a page load never plays the transition.
