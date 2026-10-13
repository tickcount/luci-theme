import test from "node:test";
import assert from "node:assert/strict";
import { loadAll } from "./settings-load.js";

const { palette: P, presets: R, share: S } = loadAll();
const HEX = /^#[0-9a-f]{6}$/;

test("every preset seed is well formed", () => {
  for (const p of [...R.TOP, ...R.THEMES]) {
    assert.match(p.id, /^[a-z0-9-]{1,32}$/);
    assert.ok(p.light || p.dark, p.id);
    for (const v of ["light", "dark"]) {
      if (!p[v]) continue;
      for (const k of ["accent", "surface", "ink"])
        assert.match(p[v][k], HEX, `${p.id}.${v}.${k}`);
      for (const k of ["font_ui", "font_code", "font_content"])
        if (p[v][k])
          assert.ok(
            k && (p[v][k] == "system" || P.FONT_STACK_RE.test(p[v][k])),
            `${p.id}.${v}.${k}`,
          );
    }
  }
});

test("the Outline preset is the stock palette", () => {
  for (const v of ["light", "dark"])
    assert.ok(P.isDefaultColors(v, R.OUTLINE[v]));
});

test("Theme menu: Outline and ChatGPT on top, the rest sorted and variant-filtered", () => {
  const dark = R.forVariant("dark"),
    light = R.forVariant("light");
  assert.deepEqual(
    dark.top.map((t) => t.id),
    ["outline", "chatgpt"],
  );
  assert.ok(!dark.themes.some((t) => t.id == "chatgpt"));
  const labels = dark.themes.map((t) => t.label);
  assert.deepEqual(
    labels,
    [...labels].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    ),
  );
  assert.ok(dark.themes.some((t) => t.id == "dracula"));
  assert.ok(!light.themes.some((t) => t.id == "dracula"));
  assert.ok(light.themes.some((t) => t.id == "proof"));
});

test("applying a preset keeps fields it does not name", () => {
  const cur = {
    ...R.OUTLINE.dark,
    contrast: 80,
    font_code: '"Fira Code"',
    preset: "outline",
  };
  const next = R.apply(cur, "nord", "dark");
  assert.equal(next.contrast, 80);
  assert.equal(next.font_code, '"Fira Code"');
  assert.equal(next.surface, "#2e3440");
  assert.equal(next.preset, "nord");
  assert.equal(next.accent_name, "custom");
  assert.equal(R.apply(cur, "vercel", "dark").contrast, 50);
  assert.equal(R.apply(cur, "outline", "dark").accent_name, "default");
});

test("share strings round-trip and enforce the variant", () => {
  const theme = {
    ...R.OUTLINE.light,
    accent: "#ff6363",
    preset: "raycast",
    font_ui: '"Inter"',
    font_ui_weight: "500",
  };
  const str = S.encode("light", theme);
  assert.ok(str.startsWith("outline-theme-v1:{"));
  const back = S.decode(str, "light").theme;
  assert.equal(back.accent, "#ff6363");
  assert.equal(back.preset, "raycast");
  assert.equal(back.font_ui, '"Inter"');
  assert.equal(back.font_ui_weight, "500");
  assert.equal(S.decode(str, "dark").error, "variant");
  assert.equal(
    S.decode(
      " " +
        encodeURIComponent(str).replace(
          "outline-theme-v1%3A",
          "outline-theme-v1:",
        ),
      "light",
    ).theme.accent,
    "#ff6363",
  );
  assert.equal(S.decode("nope", "light").error, "prefix");
  assert.equal(S.decode("outline-theme-v1:{bad", "light").error, "json");
});

test("Codex share strings import", () => {
  const codex =
    'codex-theme-v1:{"codeThemeId":"vercel","theme":{"accent":"#006efe","accentSource":"custom","contrast":50,"fonts":{"code":"\\"Geist Mono\\", ui-monospace, \\"SFMono-Regular\\"","ui":"Geist, Inter"},"ink":"#ededed","opaqueWindows":true,"semanticColors":{"diffAdded":"#00ad3a","diffRemoved":"#f13342","skill":"#9540d5"},"surface":"#000000"},"variant":"dark"}';
  const t = S.decode(codex, "dark").theme;
  assert.equal(t.preset, "vercel");
  assert.equal(t.contrast, 50);
  assert.equal(t.font_ui, "");
  assert.equal(t.font_code, "");
  assert.equal(
    S.decode(
      codex.replace('"codeThemeId":"vercel"', '"codeThemeId":"codex"'),
      "dark",
    ).theme.preset,
    "chatgpt",
  );
  assert.equal(
    S.decode(codex.replace('"vercel"', '"unknown"'), "dark").theme.preset,
    "custom",
  );
});
