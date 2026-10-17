"use strict";
"require baseclass";

/*
 * Outline palette engine.
 *
 * Expands one variant's four inputs -- accent, surface (Background), ink
 * (Foreground) and contrast -- into every colour token luci-theme-outline
 * emits, then renders the override stylesheet header.ut inlines.
 *
 * The method is Codex's (Settings > Appearance): straight sRGB lerps with
 * integer channels, alpha fills of the ink, and a contrast knob folded into a
 * normalised k. The constants are re-solved against the theme's own baked
 * palette (.dev/tokens/defaults.js in luci-theme-outline), so the Outline
 * inputs reproduce the stock tokens and every other preset lands in the same
 * design language. docs/palette.md has the derivation table.
 */

const WHITE = [255, 255, 255];
const BLACK = [0, 0, 0];

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/* Outline's stock inputs. A variant that still equals these emits nothing:
   the theme's baked tokens are the exact design, the engine an approximation. */
const DEFAULTS = {
  light: {
    accent: "#3a83f7",
    surface: "#fcfcfc",
    ink: "#0d0d0d",
    contrast: 45,
  },
  dark: { accent: "#006efe", surface: "#000000", ink: "#ededed", contrast: 60 },
};

/* Status hues are design constants, not user inputs; only their tinted
   surfaces follow the background. */
const STATUS = {
  light: {
    success: "#00a240",
    success_solid: "#008635",
    success_fg: "#008635",
    warning: "#e25507",
    warning_fg: "#b9480d",
    danger: "#e02e2a",
    danger_solid: "#e02e2a",
    danger_fg: "#ba2623",
    chart_green: "#00a240",
    chart_red: "#e02e2a",
    chart_orange: "#e25507",
    chart_yellow: "#ffc300",
  },
  dark: {
    success: "#40c977",
    success_solid: "#008635",
    success_fg: "#04b84c",
    warning: "#ff8549",
    warning_fg: "#ff8549",
    danger: "#ff6764",
    danger_solid: "#e02e2a",
    danger_fg: "#fa423e",
    chart_green: "#40c977",
    chart_red: "#ff6764",
    chart_orange: "#fb6a22",
    chart_yellow: "#ffd240",
  },
};

/* Tokens that read only the accent. When surface, ink and contrast are
   untouched only these are emitted, so recolouring the accent of the stock
   look cannot shift a single neutral. */
const ACCENT_TOKENS = [
  "accent",
  "on-accent",
  "link",
  "info",
  "ring",
  "info-surface",
  "info-surface-fg",
  "chart-blue",
  "accent-a10",
  "accent-a30",
  "info-a15",
  "info-a40",
];

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function rgb(hex) {
  const n = parseInt(String(hex).slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function hex(c) {
  return (
    "#" +
    c
      .map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0"))
      .join("")
  );
}

/* Per-channel lerp, rounded. */
function mix(a, b, t) {
  t = clamp(t, 0, 1);
  return [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t));
}

/* Translucent token as #rrggbbaa -- the form the theme's own tokens use. */
function alpha(c, a) {
  return (
    hex(c) +
    Math.round(clamp(a, 0, 1) * 255)
      .toString(16)
      .padStart(2, "0")
  );
}

function luminance(c) {
  const ch = c.map((v) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

function contrastRatio(a, b) {
  const la = luminance(a),
    lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/* Text on an accent fill: white while it stays legible as large text, the
   way the stock blue keeps white; black for the light accents. */
function onColor(c) {
  const w = contrastRatio(c, WHITE),
    b = contrastRatio(c, BLACK);
  return w >= 3 || w >= b ? WHITE : BLACK;
}

/* Walk c toward `toward` until it reads against bg at `ratio`. */
function ensureContrast(c, bg, ratio, toward) {
  let out = c;
  for (let t = 0.05; contrastRatio(out, bg) < ratio && t <= 1.0001; t += 0.05)
    out = mix(c, toward, t);
  return out;
}

/* The contrast slider as a normalised k; equals D/100 at the
   variant default and steepens above it. */
function contrastK(c, variant) {
  const D = DEFAULTS[variant].contrast;
  const i = c / 100 + ((c - D) / 60) * 0.7;
  return c <= D ? i : D / 100 + (i - D / 100) * 2;
}

function normalize(variant, theme) {
  const d = DEFAULTS[variant];
  theme = theme || {};
  const pick = (v, def) =>
    HEX_RE.test(String(v || "")) ? String(v).toLowerCase() : def;
  let c = parseInt(theme.contrast, 10);
  return {
    accent: pick(theme.accent, d.accent),
    surface: pick(theme.surface, d.surface),
    ink: pick(theme.ink, d.ink),
    contrast: isNaN(c) ? d.contrast : clamp(c, 0, 100),
  };
}

function isDefaultColors(variant, theme) {
  const n = normalize(variant, theme),
    d = DEFAULTS[variant];
  return (
    n.accent == d.accent &&
    n.surface == d.surface &&
    n.ink == d.ink &&
    n.contrast == d.contrast
  );
}

/* The full token map for one variant, keyed by CSS custom property name
   without the leading dashes. */
function derive(variant, theme) {
  const n = normalize(variant, theme);
  const A = rgb(n.accent),
    S = rgb(n.surface),
    I = rgb(n.ink);
  const dk = contrastK(n.contrast, variant) - DEFAULTS[variant].contrast / 100;
  const st = STATUS[variant];
  const t = {};

  if (variant == "light") {
    const lift = mix(S, WHITE, 0.85);
    const shell = mix(S, I, 0.0125 + dk * 0.02);
    const link = ensureContrast(mix(A, BLACK, 0.22), S, 4.5, I);
    const infoSurface = mix(lift, A, 0.1);

    Object.assign(t, {
      shell: hex(shell),
      bg: hex(S),
      surface: hex(S),
      elevated: hex(lift),
      "elevated-secondary": hex(lift),
      "dialog-bg": hex(S),
      "input-bg": hex(lift),
      "select-bg": hex(mix(S, I, 0.0377 + dk * 0.02)),
      callout: hex(mix(S, I, 0.0377 + dk * 0.02)),
      text: hex(I),
      "text-tertiary": hex(mix(S, I, 0.456 + dk * 0.1)),
      "nav-text": alpha(I, 0.85),
      border: alpha(I, 0.1 + dk * 0.04),
      hover: alpha(I, 0.05 + dk * 0.03),
      soft: alpha(I, 0.05 + dk * 0.02),
      "soft-hover": alpha(I, 0.1 + dk * 0.03),
      brand: hex(I),
      accent: hex(A),
      "on-accent": hex(onColor(A)),
      link: hex(link),
      ring: hex(A),
      "success-surface": hex(mix(lift, rgb(st.success), 0.065)),
      "warning-surface": hex(mix(lift, rgb(st.warning), 0.06)),
      "danger-surface": hex(mix(lift, rgb(st.danger), 0.07)),
      "info-surface": hex(infoSurface),
      "info-surface-fg": hex(
        ensureContrast(mix(A, BLACK, 0.4), infoSurface, 4.5, I),
      ),
      "tooltip-bg": hex(I),
      "tooltip-fg": hex(lift),
      scrim: "#00000040",
      "switch-off": alpha(I, 0.1 + dk * 0.03),
      "primary-foreground": hex(lift),
      "primary-hover": hex(mix(I, S, 0.1464)),
      "panel-bg": hex(lift),
      "muted-foreground": hex(mix(S, I, 0.665 + dk * 0.1)),
      input: alpha(I, 0.15 + dk * 0.06),
      "terminal-bg": hex(shell),
    });
  } else {
    const shell = mix(S, BLACK, 0.16 + dk * 0.1);
    const elevated = mix(S, I, 0.0802 + dk * 0.05);
    const accL = ensureContrast(
      mix(A, WHITE, 0.358 + dk * 0.15),
      S,
      4.5,
      WHITE,
    );

    Object.assign(t, {
      shell: hex(shell),
      bg: hex(S),
      surface: hex(S),
      elevated: hex(elevated),
      "elevated-secondary": hex(mix(S, I, 0.1139 + dk * 0.073)),
      "dialog-bg": hex(mix(S, I, 0.0717 + dk * 0.05)),
      "input-bg": alpha(elevated, 0.96),
      "select-bg": alpha(I, 0.027 + dk * 0.02),
      callout: alpha(mix(S, I, 0.1097 + dk * 0.05), 0.96),
      text: hex(I),
      "text-tertiary": alpha(I, 0.47 + dk * 0.13),
      "nav-text": alpha(I, 0.85),
      border: alpha(I, 0.0745 + dk * 0.04),
      hover: alpha(I, 0.0706 + dk * 0.03),
      soft: alpha(I, 0.051 + dk * 0.02),
      "soft-hover": alpha(I, 0.102 + dk * 0.03),
      brand: hex(I),
      accent: hex(A),
      "on-accent": hex(onColor(A)),
      link: hex(accL),
      ring: alpha(accL, 0.737 + dk * 0.1),
      "success-surface": hex(mix(S, rgb(st.success), 0.12)),
      "warning-surface": hex(mix(S, rgb(st.warning), 0.157)),
      "danger-surface": hex(mix(S, rgb(st.danger), 0.157)),
      "info-surface": hex(mix(S, A, 0.25)),
      "info-surface-fg": hex(
        ensureContrast(mix(A, WHITE, 0.2), mix(S, A, 0.25), 4.5, WHITE),
      ),
      "tooltip-bg": hex(elevated),
      "tooltip-fg": hex(I),
      scrim: "#00000099",
      "switch-off": alpha(I, 0.102 + dk * 0.03),
      "primary-foreground": hex(elevated),
      "primary-hover": hex(mix(I, S, 0.0717)),
      "panel-bg": hex(mix(S, I, 0.0422 + dk * 0.03)),
      "muted-foreground": alpha(I, 0.65 + dk * 0.1),
      input: alpha(I, 0.141 + dk * 0.06),
      "terminal-bg": hex(mix(S, I, 0.0549 + dk * 0.03)),
    });
  }

  /* Status constants and the names the theme keeps as copies of others
	   (spec.js aliases are flattened, so each must be written out). */
  Object.assign(t, {
    success: st.success,
    "success-solid": st.success_solid,
    "success-surface-fg": st.success_fg,
    warning: st.warning,
    "warning-surface-fg": st.warning_fg,
    "danger-solid": st.danger_solid,
    "danger-soft": alpha(rgb(st.danger), 0.1),
    "danger-surface-fg": st.danger_fg,
    destructive: st.danger,
    "chart-blue": hex(A),
    "chart-green": st.chart_green,
    "chart-red": st.chart_red,
    "chart-orange": st.chart_orange,
    "chart-yellow": st.chart_yellow,
    background: t["bg"],
    foreground: t["text"],
    primary: t["brand"],
    "panel-border": t["border"],
    muted: t["soft"],
    info: t["link"],
    "sidebar-bg": t["shell"],
    "sidebar-accent": t["hover"],
    "sidebar-active-bg": t["hover"],
    "terminal-hover": t["hover"],
    "accent-a10": alpha(A, 0.1),
    "accent-a30": alpha(A, 0.3),
    "destructive-a15": alpha(rgb(st.danger), 0.15),
    "destructive-a20": alpha(rgb(st.danger), 0.2),
    "foreground-a5": alpha(I, 0.05),
    "foreground-a10": alpha(I, 0.1),
    "foreground-a30": alpha(I, 0.3),
    "info-a15": alpha(rgb(t["link"]), 0.15),
    "info-a40": alpha(rgb(t["link"]), 0.4),
    "elevated-a60": alpha(rgb(t["elevated"].slice(0, 7)), 0.6),
    "elevated-a90": alpha(rgb(t["elevated"].slice(0, 7)), 0.9),
  });

  return t;
}

/* ── Fonts ── */

const FONT_STACK_RE = /^[A-Za-z0-9 ,"'_.\-]{1,200}$/;

const SANS_TAIL =
  '"Geist Variable", -apple-system, ui-sans-serif, system-ui, "Segoe UI", Helvetica, Arial, "Apple Color Emoji", "Noto Color Emoji", "Outline Flags", sans-serif';
const MONO_TAIL =
  '"Geist Mono Variable", ui-monospace, "SF Mono", Menlo, Consolas, monospace';
const SYSTEM_SANS =
  'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const SYSTEM_MONO =
  'ui-monospace, "SFMono-Regular", "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';

/* A stored font value: '' (the theme's own face), 'system', or a CSS
   family list. The theme's Geist stays in the tail: the "Clone⿻" glyph
   face is registered under its family. */
function fontStack(value, kind) {
  value = String(value || "").trim();
  if (value == "" || !FONT_STACK_RE.test(value)) return null;
  if (value == "system")
    return kind == "mono"
      ? SYSTEM_MONO
      : SYSTEM_SANS +
          ', "Geist Variable", "Apple Color Emoji", "Noto Color Emoji", "Outline Flags"';
  return value + ", " + (kind == "mono" ? MONO_TAIL : SANS_TAIL);
}

/* ── Stylesheet ──
 *
 * Two steps, so the router can repeat the second one without any colour
 * math: tokens() turns a variant's inputs into the custom properties to
 * override, stored in UCI as `list token 'name=#value'`; assemble() turns
 * stored tokens, fonts and sizes into the override sheet. header.ut in
 * luci-theme-outline carries a line-for-line ucode copy of assemble() and
 * must produce the same bytes -- the live preview here and the rendered
 * page are then guaranteed to agree. */

const SIZE_STEPS = [
  ["xs", 12],
  ["sm", 14],
  ["base", 16],
  ["lg", 18],
  ["xl", 20],
  ["2xl", 24],
];
const TOKEN_RE = /^([a-z0-9-]{1,40})=(#[0-9a-f]{6}(?:[0-9a-f]{2})?)$/;

/* %.4f with trailing zeros dropped (ucode: sprintf + replace). */
function num(x) {
  return x.toFixed(4).replace(/\.?0+$/, "");
}

function sizeVars(px) {
  return SIZE_STEPS.map(
    (e) => `--text-${e[0]}:${num((e[1] * px) / 14 / 16)}rem`,
  ).join(";");
}

function intIn(v, lo, hi, def) {
  const n = Number(v);
  return Number.isInteger(n) && n >= lo && n <= hi ? n : def;
}

const SELECTOR = {
  light: ':root:not([data-darkmode="true"])',
  dark: ':root[data-darkmode="true"]',
};

/* Custom properties a variant overrides, as 'name=#value' entries. Empty
   while the colours are stock; only the accent family when only the accent
   moved. */
function tokens(variant, theme) {
  if (isDefaultColors(variant, theme)) return [];
  const n = normalize(variant, theme),
    d = DEFAULTS[variant];
  const map = derive(variant, theme);
  const keys =
    n.surface == d.surface && n.ink == d.ink && n.contrast == d.contrast
      ? ACCENT_TOKENS
      : Object.keys(map);
  return keys.map((k) => `${k}=${map[k]}`);
}

function assemble(ap, variants) {
  ap = ap || {};
  const out = [];
  const ui = intIn(ap.ui_font_size, 11, 16, 14);
  const content = intIn(ap.content_font_size, 12, 24, 14);
  const code = intIn(ap.code_font_size, 8, 24, 13);

  if (ui != 14) out.push(`:root{${sizeVars(ui)}}`);
  if (ui != 14 || content != 14) out.push(`#maincontent{${sizeVars(content)}}`);
  if (code != 13) out.push(`:root{--font-size-code:${code}px}`);

  for (const v of ["light", "dark"]) {
    const t = variants[v] || {};
    const decl = [];
    for (const e of [].concat(t.token || [])) {
      const m = TOKEN_RE.exec(e);
      if (m) decl.push(`--${m[1]}:${m[2]}`);
    }
    const sans = fontStack(t.font_ui, "sans");
    const mono = fontStack(t.font_code, "mono");
    if (sans) decl.push(`--font-sans:${sans}`);
    if (mono) decl.push(`--font-mono:${mono}`);
    if (decl.length) out.push(`${SELECTOR[v]}{${decl.join(";")}}`);

    const weight = intIn(t.font_ui_weight, 100, 900, 400);
    if (weight != 400) out.push(`${SELECTOR[v]} body{font-weight:${weight}}`);

    const contentFont = fontStack(t.font_content, "sans");
    if (contentFont)
      out.push(
        `${SELECTOR[v]} #maincontent{--font-sans:${contentFont};font-family:var(--font-sans)}`,
      );
  }

  return out.join("\n");
}

/* The page state (inputs) straight to the sheet -- the live preview. */
function stylesheet(state) {
  return assemble(state.appearance, {
    light: Object.assign({}, state.light, {
      token: tokens("light", state.light || {}),
    }),
    dark: Object.assign({}, state.dark, {
      token: tokens("dark", state.dark || {}),
    }),
  });
}

/* <meta name="theme-color"> follows the sidebar canvas: the overridden
   --shell when there is one, else the theme's own. */
function themeColor(variant, theme) {
  const t = tokens(variant, theme || {}).find((e) => e.indexOf("shell=") == 0);
  return t ? t.slice(6, 13) : variant == "dark" ? "#000000" : "#f9f9f9";
}

return baseclass.extend({
  DEFAULTS: DEFAULTS,
  HEX_RE: HEX_RE,
  FONT_STACK_RE: FONT_STACK_RE,
  SYSTEM_SANS: SYSTEM_SANS,
  SYSTEM_MONO: SYSTEM_MONO,
  ACCENT_TOKENS: ACCENT_TOKENS,

  rgb: rgb,
  hex: hex,
  mix: mix,
  luminance: luminance,
  contrastRatio: contrastRatio,
  contrastK: contrastK,
  normalize: normalize,
  isDefaultColors: isDefaultColors,
  derive: derive,
  fontStack: fontStack,
  tokens: tokens,
  assemble: assemble,
  stylesheet: stylesheet,
  themeColor: themeColor,
});
