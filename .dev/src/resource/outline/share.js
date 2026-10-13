"use strict";
"require baseclass";
"require outline.palette as palette";
"require outline.presets as presets";

/*
 * Theme share strings -- the Copy / Import buttons beside "Theme".
 *
 *   outline-theme-v1:{"preset":"vercel","variant":"dark","theme":{...}}
 *
 * Plain prefixed JSON, not base64, so a string stays readable in a chat.
 * Codex's own `codex-theme-v1:` strings import too: same idea, its field
 * names. Parsing mirrors Codex: trim, prefix check, URI-decode when the body
 * does not start with "{", schema check, and the variant must match the card
 * it is pasted into.
 */

const PREFIX = "outline-theme-v1:";
const CODEX_PREFIX = "codex-theme-v1:";

const CODEX_IDS = { codex: "chatgpt" };

function encode(variant, theme) {
  const t = palette.normalize(variant, theme);
  const out = {
    preset: theme.preset || "outline",
    variant: variant,
    theme: {
      accent: t.accent,
      surface: t.surface,
      ink: t.ink,
      contrast: t.contrast,
      fonts: {
        ui: theme.font_ui || null,
        content: theme.font_content || null,
        code: theme.font_code || null,
      },
      ui_weight: theme.font_ui_weight ? +theme.font_ui_weight : null,
    },
  };
  return PREFIX + JSON.stringify(out);
}

function font(v) {
  if (v == null) return undefined;
  v = String(v).trim();
  /* Codex stores Geist as the family list it ships; here that is the default. */
  if (/^"?Geist"?(,|$)/.test(v) && !/Mono/.test(v)) return "";
  if (/^"?Geist Mono"?(,|$)/.test(v)) return "";
  return palette.FONT_STACK_RE.test(v) ? v : undefined;
}

/* Returns { theme } with the fields to merge into the variant, or { error }. */
function decode(str, variant) {
  str = String(str || "").trim();
  let codex = false,
    body;

  if (str.indexOf(PREFIX) == 0) body = str.slice(PREFIX.length);
  else if (str.indexOf(CODEX_PREFIX) == 0) {
    body = str.slice(CODEX_PREFIX.length);
    codex = true;
  } else return { error: "prefix" };

  if (body.charAt(0) != "{") {
    try {
      body = decodeURIComponent(body);
    } catch (e) {
      return { error: "json" };
    }
  }

  let data;
  try {
    data = JSON.parse(body);
  } catch (e) {
    return { error: "json" };
  }

  if (
    !data ||
    typeof data != "object" ||
    !data.theme ||
    typeof data.theme != "object"
  )
    return { error: "schema" };
  if (data.variant != variant) return { error: "variant" };

  const t = data.theme;
  const hex = (v) =>
    palette.HEX_RE.test(String(v || "")) ? String(v).toLowerCase() : null;
  const accent = hex(t.accent),
    surface = hex(t.surface),
    ink = hex(t.ink);
  if (!accent || !surface || !ink) return { error: "schema" };

  const contrast = parseInt(t.contrast, 10);
  if (isNaN(contrast) || contrast < 0 || contrast > 100)
    return { error: "schema" };

  let id = codex
    ? CODEX_IDS[data.codeThemeId] || data.codeThemeId
    : data.preset;
  if (!presets.byId(id) || !presets.byId(id)[variant]) id = "custom";

  const out = {
    preset: id,
    accent: accent,
    accent_name: "custom",
    surface: surface,
    ink: ink,
    contrast: contrast,
  };

  const fonts = t.fonts || {};
  for (const [k, field] of [
    ["ui", "font_ui"],
    ["content", "font_content"],
    ["code", "font_code"],
  ]) {
    const f = font(fonts[k]);
    if (f !== undefined) out[field] = f;
  }

  const w = parseInt(t.ui_weight, 10);
  if (w >= 100 && w <= 900) out.font_ui_weight = String(w);

  return { theme: out };
}

return baseclass.extend({
  PREFIX: PREFIX,
  encode: encode,
  decode: decode,
});
