import test from "node:test";
import assert from "node:assert/strict";
import { loadAll } from "./settings-load.js";

const { palette: P } = loadAll();

// The theme's baked inputs (luci-theme-outline .dev/tokens/defaults.js) for
// every token the engine owns exactly. Status surfaces and the accent-derived
// link shades are approximations and are only ever emitted for non-stock input.
const STOCK = {
  light: {
    shell: "#f9f9f9",
    bg: "#fcfcfc",
    elevated: "#ffffff",
    "elevated-secondary": "#ffffff",
    "dialog-bg": "#fcfcfc",
    "input-bg": "#ffffff",
    "select-bg": "#f3f3f3",
    callout: "#f3f3f3",
    text: "#0d0d0d",
    "text-tertiary": "#8f8f8f",
    "nav-text": "#0d0d0dd9",
    soft: "#0d0d0d0d",
    "soft-hover": "#0d0d0d1a",
    brand: "#0d0d0d",
    accent: "#3a83f7",
    "on-accent": "#ffffff",
    ring: "#3a83f7",
    "tooltip-bg": "#0d0d0d",
    "tooltip-fg": "#ffffff",
    "switch-off": "#0d0d0d1a",
    "primary-hover": "#303030",
    "primary-foreground": "#ffffff",
    "panel-bg": "#ffffff",
    "muted-foreground": "#5d5d5d",
    "terminal-bg": "#f9f9f9",
  },
  dark: {
    shell: "#000000",
    bg: "#000000",
    elevated: "#131313",
    "elevated-secondary": "#1b1b1b",
    "dialog-bg": "#111111",
    "input-bg": "#131313f5",
    "select-bg": "#ededed07",
    callout: "#1a1a1af5",
    text: "#ededed",
    "text-tertiary": "#ededed78",
    "nav-text": "#edededd9",
    border: "#ededed13",
    hover: "#ededed12",
    soft: "#ededed0d",
    "soft-hover": "#ededed1a",
    brand: "#ededed",
    accent: "#006efe",
    "on-accent": "#ffffff",
    link: "#5ba2fe",
    ring: "#5ba2febc",
    "tooltip-bg": "#131313",
    "tooltip-fg": "#ededed",
    "switch-off": "#ededed1a",
    "primary-hover": "#dcdcdc",
    "primary-foreground": "#131313",
    "panel-bg": "#0a0a0a",
    "muted-foreground": "#edededa6",
    input: "#ededed24",
    "terminal-bg": "#0d0d0d",
  },
};

for (const v of ["light", "dark"])
  test(`stock ${v} inputs reproduce the theme's baked tokens`, () => {
    const t = P.derive(v, P.DEFAULTS[v]);
    for (const [k, want] of Object.entries(STOCK[v]))
      assert.equal(t[k], want, `--${k}`);
  });

test("a stock configuration emits an empty stylesheet", () => {
  assert.equal(
    P.stylesheet({
      appearance: {},
      light: P.DEFAULTS.light,
      dark: P.DEFAULTS.dark,
    }),
    "",
  );
  assert.equal(
    P.stylesheet({
      appearance: {
        ui_font_size: 14,
        content_font_size: 14,
        code_font_size: 13,
      },
      light: {},
      dark: {},
    }),
    "",
  );
});

test("recolouring only the accent leaves every neutral alone", () => {
  const css = P.stylesheet({
    appearance: {},
    light: { ...P.DEFAULTS.light, accent: "#ee7c37" },
    dark: P.DEFAULTS.dark,
  });
  const names = [...css.matchAll(/--([a-z0-9-]+):/g)].map((m) => m[1]);
  assert.deepEqual(names.sort(), [...P.ACCENT_TOKENS].sort());
  assert.match(css, /^:root:not\(\[data-darkmode="true"\]\)\{/);
});

test("variants are scoped so neither overrides the other", () => {
  const css = P.stylesheet({
    appearance: {},
    light: {
      accent: "#ff0000",
      surface: "#ffffff",
      ink: "#000000",
      contrast: 45,
    },
    dark: {
      accent: "#00ff00",
      surface: "#101010",
      ink: "#eeeeee",
      contrast: 60,
    },
  });
  assert.match(
    css,
    /:root:not\(\[data-darkmode="true"\]\)\{[^}]*--accent:#ff0000/,
  );
  assert.match(css, /:root\[data-darkmode="true"\]\{[^}]*--accent:#00ff00/);
});

test("every emitted value is a hex colour and nothing can escape the style element", () => {
  const css = P.stylesheet({
    appearance: {},
    light: {
      accent: "#123456",
      surface: "#fdf6e3",
      ink: "#657b83",
      contrast: 90,
    },
    dark: {
      accent: "#d30102",
      surface: "#002b36",
      ink: "#839496",
      contrast: 0,
    },
  });
  for (const [, value] of css.matchAll(/--[a-z0-9-]+:([^;}]+)/g))
    assert.match(value, /^#[0-9a-f]{6}([0-9a-f]{2})?$/);
  assert.doesNotMatch(css, /[<\\]|url\(|@import/);
});

test("links stay readable on any background", () => {
  for (const [surface, ink, accent] of [
    ["#ffffff", "#000000", "#f6c543"],
    ["#fdf6e3", "#657b83", "#b58900"],
    ["#000000", "#ededed", "#3d59a1"],
  ]) {
    const v = P.luminance(P.rgb(surface)) > 0.5 ? "light" : "dark";
    const t = P.derive(v, {
      accent,
      surface,
      ink,
      contrast: P.DEFAULTS[v].contrast,
    });
    assert.ok(
      P.contrastRatio(P.rgb(t.link), P.rgb(surface)) >= 4.5,
      `${accent} on ${surface}: ${t.link}`,
    );
  }
});

test("contrast raises border strength monotonically", () => {
  const a = (c) =>
    parseInt(
      P.derive("dark", { ...P.DEFAULTS.dark, contrast: c }).border.slice(7),
      16,
    );
  assert.ok(a(0) < a(60) && a(60) < a(100));
});

test("sizes and fonts", () => {
  const css = P.stylesheet({
    appearance: { ui_font_size: 16, content_font_size: 14, code_font_size: 12 },
    light: {
      ...P.DEFAULTS.light,
      font_ui: '"Inter"',
      font_code: "system",
      font_ui_weight: "500",
    },
    dark: P.DEFAULTS.dark,
  });
  assert.match(css, /^:root\{--text-xs:0\.8571rem;--text-sm:1rem/);
  assert.match(css, /#maincontent\{--text-xs:0\.75rem;--text-sm:0\.875rem/);
  assert.match(css, /--font-size-code:12px/);
  assert.match(css, /--font-sans:"Inter", "Geist Variable"/);
  assert.match(css, /--font-mono:ui-monospace/);
  assert.match(css, /body\{font-weight:500\}/);
});

test("font stacks that could break out of a declaration are dropped", () => {
  assert.equal(P.fontStack("Inter; } body { display:none", "sans"), null);
  assert.equal(P.fontStack('"Inter"</style>', "sans"), null);
});

// header.ut assembles the stored tokens with a ucode copy of assemble().
// Its behaviour cannot run here, but its constants can be held to the
// engine's: a drifted font tail, selector or size step would make every
// rendered page disagree with the Appearance preview.
test("header.ut assembles with the same constants as palette.js", async () => {
  const { readFileSync } = await import("node:fs");
  const { root, resource } = await import("./settings-load.js");
  const header = readFileSync(
    `${root}/ucode/template/themes/outline/header.ut`,
    "utf8",
  );
  const palette = readFileSync(resource("outline/palette.js"), "utf8");
  const constOf = (src, name) =>
    (src.match(new RegExp(`const ${name} =\\s*'([^']*)'`)) || [])[1];
  for (const name of ["SANS_TAIL", "MONO_TAIL", "SYSTEM_SANS", "SYSTEM_MONO"]) {
    assert.ok(constOf(palette, name), `palette.js ${name}`);
    assert.equal(constOf(header, name), constOf(palette, name), name);
  }
  assert.ok(
    header.includes(
      `light: '${P.assemble({}, { light: { token: ["accent=#ff0000"] }, dark: {} }).match(/^(.*?)\{/)[1]}'`,
    ),
    "light selector",
  );
  assert.ok(
    header.includes(
      `dark: '${P.assemble({}, { light: {}, dark: { token: ["accent=#ff0000"] } }).match(/^(.*?)\{/)[1]}'`,
    ),
    "dark selector",
  );
  const steps = (src) =>
    [...src.matchAll(/\[\s*["'](xs|sm|base|lg|xl|2xl)["'],\s*(\d+)\s*\]/g)]
      .map((m) => m[1] + m[2])
      .join(",");
  assert.equal(steps(header), steps(palette));
  assert.equal(steps(palette), "xs12,sm14,base16,lg18,xl20,2xl24");
});
