/**
 * Copyright (C) 2025 eamonxg <eamonxiong@gmail.com>
 * Licensed under the Apache License, Version 2.0.
 */

import { readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { alpha, toOklch } from "@eamonxg/luci-theme-tokens/engine";
import { block, themeColors } from "@eamonxg/luci-theme-tokens/emit";
import { resolveMode } from "../tokens/resolve.js";
import { ALPHAS } from "../tokens/spec.js";

const snake = (s) => s.replace(/-/g, "_");
const withAlpha = (oklchStr, pct) => toOklch(alpha(oklchStr, pct / 100));

function alphaTokens(resolved) {
  const out = {};
  for (const [base, list] of Object.entries(ALPHAS)) {
    const val = resolved[snake(base)];
    if (val === undefined) throw new Error(`ALPHAS base not resolved: ${base}`);
    for (const a of list) out[`${base}-a${a}`] = withAlpha(val, a);
  }
  return out;
}

// Emit only tokens some source actually reads (a utility like bg-<name> or
// var(--<name>)) across the stylesheets, patches, client JS and templates.
// Inputs that exist only to feed an alias (shell -> sidebar-bg, …) and
// unused alpha variants stay out of the shipped CSS.
async function sourceText() {
  const roots = ["../src", "../../ucode"].map((d) =>
    resolve(import.meta.dirname, d),
  );
  const texts = [];
  for (const root of roots)
    for (const f of await readdir(root, { recursive: true }))
      if (/\.(css|js|ut)$/.test(f) && !f.endsWith("_tokens.css"))
        texts.push(await readFile(resolve(root, f), "utf8"));
  return texts.join("\n");
}
const sources = await sourceText();
const isUsed = (name) =>
  new RegExp(`-${name.replace(/_/g, "-")}(?![\\w-])`).test(sources);
const used = (map) =>
  Object.fromEntries(Object.entries(map).filter(([k]) => isUsed(k)));

const light = resolveMode("light");
const dark = resolveMode("dark");
const lightA = alphaTokens(light);
const darkA = alphaTokens(dark);
const lightOut = used(light);
const darkOut = used(dark);
const lightAOut = used(lightA);
const darkAOut = used(darkA);

const STRUCTURE = `
  --font-sans:
    "Geist Variable", Geist, -apple-system, ui-sans-serif, system-ui,
    "Segoe UI", Helvetica, Arial, sans-serif;
  --font-mono:
    "Geist Mono Variable", "Geist Mono", ui-monospace, "SF Mono", Menlo,
    Consolas, monospace;
  /* Kept for on-demand patches/*.css; the corner ladder itself is Tailwind's
     default scale, which is exactly ChatGPT's (2/4/6/8/12/16/24px). */
  --radius-base: 0.5rem;

  /* Elevation (ChatGPT): emitted on :root (not just inlined into the shadow-*
     utilities) so on-demand patches/*.css -- standalone entries that carry no
     Tailwind helper output -- can reach it as var(--shadow-sm). */
  --shadow-sm: 0 1px 2px -1px #00000014;
  --shadow-md: 0 2px 4px -1px #00000014;
  --shadow-lg: 0 4px 8px -2px #0000001a;
  --shadow-xl: 0 8px 16px -4px #0000001f;
  --shadow-2xl: 0 16px 32px -8px #00000030;
  /* Codex's dropdown overlay: a 0.5px ring in the border ink drawn twice
     (its ring utility plus shadow-xl-spread), then shadow-xl. */
  --shadow-menu:
    0 0 0 0.5px var(--border), 0 0 0 0.5px var(--border),
    0 8px 16px -4px #0000001f;
`;

const themeColorsCss = themeColors([
  ...Object.keys(lightOut),
  ...Object.keys(lightAOut),
]);

// Add aliases for backward compatibility
const aliases = [
  `  --color-sidebar-fg: var(--sidebar-foreground);`,
  `  --color-terminal-fg: var(--terminal-foreground);`,
].join("\n");

const THEME = `@theme inline {
${themeColorsCss}

${aliases}

  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);

  --shadow-sm: var(--shadow-sm);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);
  --shadow-2xl: var(--shadow-2xl);
  --shadow-menu: var(--shadow-menu);

  --ease-enter: cubic-bezier(0.19, 1, 0.22, 1);
}
`;

const HEADER = `/**
 * luci-theme-outline: design tokens -- GENERATED, DO NOT EDIT.
 * Run \`pnpm gen:tokens\`. Source: tokens/defaults.js + tokens/spec.js
 * All color values are flat oklch() literals; no dynamic color functions.
 * Dark mode overrides must stay after light mode block.
 */
`;

const css =
  HEADER +
  "\n" +
  block(":root", lightOut, lightAOut) +
  STRUCTURE +
  "}\n\n" +
  block('[data-darkmode="true"]', darkOut, darkAOut) +
  "}\n\n" +
  THEME;

await writeFile(
  resolve(import.meta.dirname, "../src/media/_tokens.css"),
  css,
  "utf-8",
);
console.log("gen-tokens: wrote src/media/_tokens.css");
