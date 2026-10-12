import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const output = resolve(import.meta.dirname, "../../htdocs/luci-static");
const read = (path) => readFileSync(resolve(output, path), "utf8");
const bytes = (path) => statSync(resolve(output, path)).size;

test("pruned login.css keeps every consumed variable resolvable", () => {
  const css = read("outline/login.css");
  const declared = new Set(
    [...css.matchAll(/[{;](--[\w-]+):/g)].map((m) => m[1]),
  );
  const registered = new Set(
    [...css.matchAll(/@property\s+(--[\w-]+)/g)].map((m) => m[1]),
  );
  // Custom properties declared inline by templates at render time (none
  // since the login page dropped its background image).
  const injected = new Set();

  const unresolvable = [];
  for (const [, name, delim] of css.matchAll(/var\(\s*(--[\w-]+)\s*([,)])/g))
    if (
      delim !== "," &&
      !declared.has(name) &&
      !registered.has(name) &&
      !injected.has(name)
    )
      unresolvable.push(name);
  assert.deepEqual([...new Set(unresolvable)], []);

  for (const adminOnly of ["--sidebar-bg:", "--terminal-foreground:"])
    assert.ok(!css.includes(adminOnly), `${adminOnly} should be pruned`);
  assert.ok(
    css.includes("-webkit-font-smoothing"),
    "prefixes must survive the prune",
  );
});

// uhttpd serves identity bytes, so raw size is what every cold load pays.
// Set 2026-09 from main 129213, login 10521, menu 15859, router 15771,
// sidebar 6107, Inter latin 48256, logo 258. 2026-10 ChatGPT restyle: Geist
// latin is 29400 (19 KB under Inter), which pays for main.css growing to
// ~138 KB (switches, menus, split buttons, icon variables) — the admin
// total below is unchanged and still the binding cold-load budget.
test("production assets stay within raw-transfer budgets", () => {
  const main = bytes("outline/main.css");
  const login = bytes("outline/login.css");
  const menu = bytes("resources/menu-outline.js");
  const router = bytes("resources/router-outline.js");
  const sidebar = bytes("resources/sidebar-outline.js");
  const font = bytes("outline/geist-latin-wght-normal.woff2");
  const logo = bytes("outline/images/logo.png");

  // 165K: the ChatGPT restyle covers every LuCI widget (switches, menus,
  // split buttons, meters, chart cards, Lucide replacements for LuCI's
  // Tango icons, …).
  // 175K: the full page/tab/modal sweep added ~11 KB — Analytics legend and
  // segmented switchers, the one-glyph clone-icon font (~1 KB inline),
  // dialog-surface, device popover, in-field address toggle, appended
  // heading blocks, composite pickers and the package-manager panel.
  // 200K: raised by the maintainer to leave room for further ChatGPT
  // adaptation (174 KB at the time).
  assert.ok(main <= 200_000, `main.css ${main} B exceeds 200 KB`);
  assert.ok(login <= 11_000, `login.css ${login} B exceeds 11 KB`);
  // 17.5K: palette tabs (third-level nodes, redirect-parent folding, legacy
  // recents mapping, parent-aware scoring, per-segment path words) added
  // ~1.2 KB; the admin total below moved by the same amount.
  // 18.5K: the ChatGPT sidebar's icon rail and the palette's section
  // filter pills added ~0.7 KB; the admin total below still holds.
  assert.ok(menu <= 18_500, `menu-outline.js ${menu} B exceeds 18.5 KB`);
  assert.ok(router <= 16_000, `router-outline.js ${router} B exceeds 16 KB`);
  // 7K: independent group folds (persisted) and the rail's logo-to-expand
  // control for the ChatGPT sidebar.
  assert.ok(sidebar <= 7_000, `sidebar-outline.js ${sidebar} B exceeds 7 KB`);
  assert.ok(
    // 232.5K (was 217.5K under Inter): Geist saves 19 KB, the full ChatGPT
    // restyle (CSS + rail/palette JS) spends ~24 KB.
    // 245K: main.css's sweep growth above (~11 KB raw, ~2 KB gzip).
    // 270K: follows main.css's 200K ceiling (+25 KB).
    main + menu + router + sidebar + font <= 270_000,
    "admin assets exceed 270 KB",
  );
  assert.ok(login + font + logo <= 60_000, "login assets exceed 60 KB");
});
