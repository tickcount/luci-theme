"use strict";
"require baseclass";

/*
 * Theme presets, named accents and the curated font lists.
 *
 * The Theme menu's top level holds "Outline" (the theme's stock look) and
 * "ChatGPT" (ChatGPT's own theme, top-level in Codex too); the rest of the
 * Codex collection follows in one list, by name. A preset sets only the
 * fields it names -- picking one keeps the current contrast and fonts unless
 * the preset carries its own, exactly like Codex.
 *
 * Font values: '' = the theme's own face (Geist / Geist Mono), 'system' = the
 * OS face, anything else = a CSS family list.
 */

const OUTLINE = {
  id: "outline",
  label: "Outline",
  light: {
    accent: "#3a83f7",
    surface: "#fcfcfc",
    ink: "#0d0d0d",
    contrast: 45,
    font_ui: "",
    font_code: "",
  },
  dark: {
    accent: "#006efe",
    surface: "#000000",
    ink: "#ededed",
    contrast: 60,
    font_ui: "",
    font_code: "",
  },
};

const CHATGPT = {
  id: "chatgpt",
  label: "ChatGPT",
  light: { accent: "#0169cc", surface: "#ffffff", ink: "#0d0d0d" },
  dark: { accent: "#0169cc", surface: "#111111", ink: "#fcfcfc" },
};

const INTER = '"Inter"';
const MONO_STACK =
  'ui-monospace, "SFMono-Regular", "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';

function p(id, label, light, dark) {
  const o = { id: id, label: label };
  const seed = (a) =>
    a && Object.assign({ accent: a[0], surface: a[1], ink: a[2] }, a[3] || {});
  if (light) o.light = seed(light);
  if (dark) o.dark = seed(dark);
  return o;
}

const THEMES = [
  p(
    "absolutely",
    "Absolutely",
    ["#cc7d5e", "#f9f9f7", "#2d2d2b"],
    ["#cc7d5e", "#2d2d2b", "#f9f9f7"],
  ),
  p("ayu", "Ayu", null, ["#e6b450", "#10141c", "#bfbdb6"]),
  p(
    "catppuccin",
    "Catppuccin",
    ["#8839ef", "#eff1f5", "#4c4f69"],
    ["#cba6f7", "#1e1e2e", "#cdd6f4"],
  ),
  p("dracula", "Dracula", null, ["#ff79c6", "#282a36", "#f8f8f2"]),
  p(
    "everforest",
    "Everforest",
    ["#93b259", "#fdf6e3", "#5c6a72"],
    ["#a7c080", "#2d353b", "#d3c6aa"],
  ),
  p(
    "github",
    "GitHub",
    ["#0969da", "#ffffff", "#1f2328"],
    ["#1f6feb", "#0d1117", "#e6edf3"],
  ),
  p(
    "gruvbox",
    "Gruvbox",
    ["#458588", "#fbf1c7", "#3c3836"],
    ["#458588", "#282828", "#ebdbb2"],
  ),
  p(
    "linear",
    "Linear",
    ["#5e6ad2", "#fcfcfd", "#1b1b1b", { font_ui: INTER }],
    ["#606acc", "#0f0f11", "#e3e4e6", { font_ui: INTER }],
  ),
  p("lobster", "Lobster", null, [
    "#ff5c5c",
    "#111827",
    "#e4e4e7",
    { font_ui: '"Satoshi"' },
  ]),
  p("material", "Material", null, ["#80cbc4", "#212121", "#eeffff"]),
  p("matrix", "Matrix", null, [
    "#1eff5a",
    "#040805",
    "#b8ffca",
    { font_ui: MONO_STACK, font_code: "system" },
  ]),
  p("monokai", "Monokai", null, ["#99947c", "#272822", "#f8f8f2"]),
  p("night-owl", "Night Owl", null, ["#44596b", "#011627", "#d6deeb"]),
  p("nord", "Nord", null, ["#88c0d0", "#2e3440", "#d8dee9"]),
  p(
    "notion",
    "Notion",
    [
      "#3183d8",
      "#ffffff",
      "#37352f",
      { font_ui: "system", font_code: "system" },
    ],
    [
      "#3183d8",
      "#191919",
      "#d9d9d8",
      { font_ui: "system", font_code: "system" },
    ],
  ),
  p("og", "OG", null, [
    "#10a37f",
    "#343541",
    "#d1d5db",
    {
      font_ui: "Arial, sans-serif",
      font_content: "Arial, sans-serif",
      font_code: "system",
    },
  ]),
  p(
    "one",
    "One",
    ["#526fff", "#fafafa", "#383a42"],
    ["#4d78cc", "#282c34", "#abb2bf"],
  ),
  p("oscurange", "Oscurange", null, ["#f9b98c", "#0b0b0f", "#e6e6e6"]),
  p(
    "proof",
    "Proof",
    [
      "#3d755d",
      "#f5f3ed",
      "#2f312d",
      { font_ui: "system", font_code: "system" },
    ],
    null,
  ),
  p(
    "raycast",
    "Raycast",
    [
      "#ff6363",
      "#ffffff",
      "#030303",
      { font_ui: INTER, font_code: '"JetBrains Mono"' },
    ],
    [
      "#ff6363",
      "#101010",
      "#fefefe",
      { font_ui: INTER, font_code: '"JetBrains Mono"' },
    ],
  ),
  p(
    "rose-pine",
    "Rose Pine",
    ["#d7827e", "#faf4ed", "#575279"],
    ["#ea9a97", "#232136", "#e0def4"],
  ),
  p("sentry", "Sentry", null, [
    "#7055f6",
    "#2d2935",
    "#e6dff9",
    { font_ui: "system", font_code: "system" },
  ]),
  p(
    "solarized",
    "Solarized",
    ["#b58900", "#fdf6e3", "#657b83"],
    ["#d30102", "#002b36", "#839496"],
  ),
  p("temple", "Temple", null, ["#e4f222", "#02120c", "#c7e6da"]),
  p("tokyo-night", "Tokyo Night", null, ["#3d59a1", "#1a1b26", "#a9b1d6"]),
  p(
    "vercel",
    "Vercel",
    [
      "#006aff",
      "#ffffff",
      "#171717",
      { contrast: 40, font_ui: "", font_code: "" },
    ],
    [
      "#006efe",
      "#000000",
      "#ededed",
      { contrast: 50, font_ui: "", font_code: "" },
    ],
  ),
  p(
    "vscode-plus",
    "VS Code Plus",
    ["#007acc", "#ffffff", "#000000"],
    ["#007acc", "#1e1e1e", "#d4d4d4"],
  ),
  p(
    "xcode",
    "Xcode",
    ["#0e0eff", "#ffffff", "#000000", { font_code: '"SF Mono"' }],
    ["#5482ff", "#1f1f24", "#ffffff", { font_code: '"SF Mono"' }],
  ),
];

/* Codex's named accents (ramp shade 400; 300 for purple). "Default" is the
   Outline accent of the variant; "Black" reads "White" in dark. */
const ACCENTS = [
  {
    id: "default",
    label: _("Default"),
    light: "#3a83f7",
    dark: "#006efe",
    dot: { light: "#000000", dark: "#ffffff" },
  },
  {
    id: "blue",
    label: _("Blue"),
    light: "#3a83f7",
    dark: "#3a83f7",
    dot: "#3566f0",
  },
  {
    id: "green",
    label: _("Green"),
    light: "#53b559",
    dark: "#53b559",
    dot: "#04bb9f",
  },
  {
    id: "yellow",
    label: _("Yellow"),
    light: "#f6c543",
    dark: "#f6c543",
    dot: "#ffcc38",
  },
  {
    id: "pink",
    label: _("Pink"),
    light: "#f077af",
    dark: "#f077af",
    dot: "#fa70ab",
  },
  {
    id: "orange",
    label: _("Orange"),
    light: "#ee7c37",
    dark: "#ee7c37",
    dot: "#ff8066",
  },
  {
    id: "purple",
    label: _("Purple"),
    light: "#a67df2",
    dark: "#a67df2",
    dot: "#a25bff",
  },
  {
    id: "black",
    label: { light: _("Black"), dark: _("White") },
    light: "#0d0d0d",
    dark: "#ededed",
    dot: { light: "#000000", dark: "#ffffff" },
  },
];

/* Browsers cannot list installed fonts without a permission prompt, so the
   menus offer a curated list plus "Custom…" (and, where the Local Font Access
   API exists, the visitor's own fonts). A family that is not installed on the
   viewing machine falls back to the theme's face. */
const UI_FONTS = [
  { value: "", label: "Geist" },
  { value: "system", label: _("System") },
  { value: INTER, label: "Inter" },
  { value: '"Roboto"', label: "Roboto" },
  { value: '"Segoe UI"', label: "Segoe UI" },
  { value: '"Helvetica Neue", Helvetica', label: "Helvetica Neue" },
  { value: "Arial, sans-serif", label: "Arial" },
  { value: '"IBM Plex Sans"', label: "IBM Plex Sans" },
  { value: "Georgia, serif", label: "Georgia" },
];

const CODE_FONTS = [
  { value: "", label: "Geist Mono" },
  { value: "system", label: _("System") },
  { value: '"JetBrains Mono"', label: "JetBrains Mono" },
  { value: '"Fira Code"', label: "Fira Code" },
  { value: '"SF Mono"', label: "SF Mono" },
  { value: "Menlo", label: "Menlo" },
  { value: "Consolas", label: "Consolas" },
  { value: '"Cascadia Code"', label: "Cascadia Code" },
];

const FONT_WEIGHTS = [
  { value: "300", label: _("Light") },
  { value: "400", label: _("Regular") },
  { value: "500", label: _("Medium") },
  { value: "600", label: _("Semibold") },
];

const TOP = [OUTLINE, CHATGPT];

function byId(id) {
  return TOP.concat(THEMES).find((t) => t.id == id) || null;
}

/* Presets usable in a variant: the top-level pair, then the collection
   sorted by label the way Codex's menu sorts it. */
function forVariant(variant) {
  const collator = new Intl.Collator(undefined, { sensitivity: "base" });
  return {
    top: TOP.filter((t) => t[variant]),
    themes: THEMES.filter((t) => t[variant]).sort((a, b) =>
      collator.compare(a.label, b.label),
    ),
  };
}

/* Selecting a preset: shallow-merge its seed over the current variant theme
   (unnamed fields survive) and remember which preset it came from. */
function apply(current, presetId, variant) {
  const preset = byId(presetId);
  const seed = preset && preset[variant];
  if (!seed) return current;
  return Object.assign({}, current, seed, {
    preset: preset.id,
    accent_name: preset.id == OUTLINE.id ? "default" : "custom",
  });
}

function accentHex(id, variant) {
  const a = ACCENTS.find((x) => x.id == id);
  return a ? a[variant] : null;
}

function labelFor(list, value) {
  const hit = list.find((f) => f.value == (value || ""));
  if (hit) return hit.label;
  /* A custom family list shows its first family, unquoted. */
  return (
    String(value || "")
      .split(",")[0]
      .replace(/["']/g, "")
      .trim() || list[0].label
  );
}

return baseclass.extend({
  OUTLINE: OUTLINE,
  CHATGPT: CHATGPT,
  TOP: TOP,
  THEMES: THEMES,
  ACCENTS: ACCENTS,
  UI_FONTS: UI_FONTS,
  CODE_FONTS: CODE_FONTS,
  FONT_WEIGHTS: FONT_WEIGHTS,
  byId: byId,
  forVariant: forVariant,
  apply: apply,
  accentHex: accentHex,
  labelFor: labelFor,
});
