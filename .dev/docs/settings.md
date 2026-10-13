# System › Outline Theme (settings pages)

The theme ships its own settings: **Appearance**, **Branding** and **Package**
under `admin/system/outline`.

## Files

| Path                                                              | Role                                                               |
| ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| `.dev/src/resource/view/outline/appearance.js`                    | Appearance page: state, page-only preview, Save/Reset              |
| `.dev/src/resource/view/outline/branding.js`                      | Branding page: logo, app icon, uploads                             |
| `.dev/src/resource/view/outline/package.js`                       | Package page: release check, update, uninstall, purge              |
| `.dev/src/resource/outline/palette.js`                            | 4 inputs → token overrides → stylesheet (`tokens()`, `assemble()`) |
| `.dev/src/resource/outline/presets.js`                            | Outline, ChatGPT and the Codex presets; named accents; font lists  |
| `.dev/src/resource/outline/share.js`                              | `outline-theme-v1:` / `codex-theme-v1:` share strings              |
| `.dev/src/resource/outline/icons.js`                              | App icon → favicon / ICO / 180 / 192 / 512 in the browser          |
| `.dev/src/resource/outline/ui.js`                                 | Codex-style widgets and their CSS (`ot-*`)                         |
| `root/usr/share/rpcd/ucode/luci.outline`                          | rpcd object `luci.outline`                                         |
| `root/usr/libexec/outline/job`                                    | detached package worker                                            |
| `root/usr/share/luci/menu.d/luci-theme-outline.json`, `…/acl.d/…` | menu, ACL                                                          |
| `root/etc/uci-defaults/30_luci-theme-outline`                     | activation + `/etc/config/outline` sections                        |
| `install.sh`                                                      | first installation / removal over SSH                              |

The pages are built like every other resource: `luci-js-compress` runs terser
over `src/resource/**` (they are excluded from Tailwind's scan in `main.css`).
`LUCI_MINIFY_JS:=0` in the Makefile keeps luci.mk's jsmin away from them: it
would squeeze the CSS inside `ui.js`'s template literal (`.ot *` → `.ot*`).

## Storage and rendering

```
/etc/config/outline
  appearance  mode, reduced_motion, ui/content/code_font_size,
              navigation (navbar | sidebar; unset = navbar)
  light|dark  preset, accent_name, accent, surface, ink, contrast,
              font_ui, font_ui_weight, font_content, font_code,
              list token 'name=#rrggbb[aa]'      ← derived by palette.tokens()
  branding    logo, icon, favicon, favicon_ico, apple_touch, pwa_192, pwa_512, rev
  updates     repo (optional; default tickcount/luci-theme-outline)
```

`header.ut` assembles the override sheet from the committed config with a
line-for-line ucode copy of `palette.assemble()` and emits it in
`<style id="outline-appearance" data-luci-shell>` (the login page included),
plus `html[data-default-theme]`, `html[data-reduced-motion]`, the theme-color
metas, the brand URLs, `#sidebar[data-logo]` and the PWA manifest (written to
`/www/luci-static/outline-brand/site.webmanifest` whenever it is out of date).
A stock configuration produces an empty sheet. `settings-palette.test.js` holds
the ucode constants to the JS ones; the assembly itself can only run on a
device -- after a change, compare the rendered `#outline-appearance` text with
`palette.stylesheet()` for the same state.

Two template pitfalls, both learned on the device:

- No `}}` anywhere inside a `{% %}` block, comments included: the template
  lexer reads it as the end of a `{{ }}` tag. Build such strings by
  concatenation.
- No `\x00` in a regex: ucode hands it to POSIX `regcomp`, which stops at the
  NUL and fails at render time with "Missing ']'" -- `ucode -c` does not catch
  it, and it takes every page down. Use `[:cntrl:]`.

## Preview and saving

Controls preview on their page only: Appearance rewrites `#outline-appearance`
and the mode/motion attributes, Branding the sidebar logo and icon links. A
MutationObserver restores the originals when the view leaves `#view` (the
router swaps pages in place). Nothing is stored until the footer's **Save**
(`uci.set` + `uci.save()`, staged as LuCI unsaved changes) or **Save & Apply**
(view's default `handleSaveApply` → `ui.changes.apply()`, with rollback).
**Reset** returns to the loaded or last saved state.

## Palette

Codex expands accent A, surface S, ink I and contrast c with integer sRGB
lerps and ink-alpha fills, c folded into k (`contrastK`, D/100 at the variant
default D = 45 light / 60 dark). The constants are solved against
`.dev/tokens/defaults.js` with Codex's slopes in k, so the stock inputs
reproduce every neutral exactly (`settings-palette.test.js`). Only the accent
family is written when only the accent moved. The theme flattens aliases and
alpha variants into literals, so `derive()` writes every consumer name: if a
token is renamed in `defaults.js`/`spec.js`, update `derive()` and the test.

## Branding

Uploads go through `cgi-upload` to `/tmp/outline-brand.upload`; `brand_upload`
checks type, size (4 MB) and content (magic bytes; an SVG with script, event
handlers, `foreignObject` or external references is refused, since it is
served from LuCI's origin) and stores `<slot>-<time>.<ext>` under
`/www/luci-static/outline-brand/` (kept across sysupgrade by
`/lib/upgrade/keep.d/luci-theme-outline`). Per slot it keeps the two newest
uploads plus the committed one. `logo=openwrt` points at
luci-theme-bootstrap's `logo.svg`. The App icon is rendered in the browser
(canvas) into the five icon slots on Save.

## Package

`job_start` forks `/usr/libexec/outline/job` (which re-runs itself from
`/tmp`), the page polls `job_status`. Releases resolve as manifest.json → API →
Atom feed + `expanded_assets` (the API rate-limits CGNAT addresses);
`manifest.json` is published by the release workflow with a sha256 per
package. `install.sh` uses the same chain.

- **Uninstall**: LuCI → Bootstrap, `luci.themes.Outline` deleted, package and
  leftovers removed; `/etc/config/outline` and brand images kept.
- **Remove completely**: the above plus the config and brand images; the page
  clears this browser's `outline.*` storage.
