# Build & dev server

**Dual-layer build**: source in `.dev/` → OpenWrt-compatible output in `htdocs/luci-static/`.

| source                               | output                                                                                    |
| ------------------------------------ | ----------------------------------------------------------------------------------------- |
| `.dev/src/media/main.css`            | `htdocs/luci-static/outline/main.css`                                                     |
| `.dev/src/media/login.css`           | `htdocs/luci-static/outline/login.css`                                                    |
| `.dev/src/resource/*.js`             | `htdocs/luci-static/resources/*.js` (`menu-outline`, `sidebar-outline`, `router-outline`) |
| `.dev/src/media/patches/*`           | `htdocs/luci-static/outline/patches/*` (see [patches.md](patches.md))                     |
| `.dev/public/outline/`               | `htdocs/luci-static/outline/` — icons/images copied as-is                                 |
| `ucode/template/themes/outline/*.ut` | not processed by Vite; pushed to a device via the SSH dev plugin                          |

`htdocs/` is generated and **not in git** (`.gitignore`): `pnpm build` writes it locally, CI builds it for the checks and for every package. Nothing commits build output.

## Terser options that are load-bearing

`.dev/src/resource/*.js` goes through terser (compress + local-scope mangle, no bundling); each file stays a standalone LuCI `L.require()`-able module. Two options must not be dropped:

- `compress.directives: false` — keeps the leading `'require <dep>'` strings that LuCI's dependency scanner reads;
- `mangle.toplevel: false` — keeps top-level names (plus `parse.bare_returns` for the top-level `return`).

## Dev-server environment

All env vars are optional. `VITE_OPENWRT_HOST` is the bare router address (default `192.168.1.1`); the web proxy target and the `.ut`-sync SSH target (`root@<hostname>`) both derive from it — key selection etc. belongs in `~/.ssh/config`.

`ucode/template/themes/outline/*.ut` is pushed whole to `/usr/share/ucode/luci/template/themes/outline/` on dev-server startup and on every save (tar over ssh stdin), and `/cgi-bin` page loads wait for in-flight pushes.

Page patches are discovered on the device (`header.ut` lists `/www/luci-static/outline/patches/`), so a **new** patch file only loads in dev once its built copy is on the router (`pnpm build`, then scp it there); edits to an existing one are served from source.

Pages that embed a service by port on `location.hostname` (Services › Terminal: ttyd's iframe on `:7681`) point at `127.0.0.1` in dev. Forward the port to see them: `ssh -fN -L 127.0.0.1:7681:<router>:7681 root@<router>`.

`pnpm setup:router` writes all of that to `.env` and installs the SSH key on the device in one shot (`pnpm setup:router <ip>` to run non-interactively; safe to re-run after a reflash).

## `vite.config.ts` plugins

- `local-serve-plugin` — serves `main.css`/`login.css`/sidebar, menu & router JS at their `/luci-static/...` paths during `pnpm dev` and forces a full reload on change
- `ut-sync-plugin` — pushes the `.ut` template dir to the router over SSH (full push on startup + debounced push on save; `/cgi-bin` requests wait for pending pushes)
- `redirect-plugin` — redirects `/` to `/cgi-bin/luci` in dev
- `luci-js-compress` — runs `.dev/src/resource/*.js` through terser into `resources/`
- `mock-pages-plugin` — serves saved page snapshots at `/mocks/` against the live theme, and injects the mock bar into both those and proxied device pages (see [mock-pages.md](mock-pages.md))

## Tests & formatting

No linter CLI; the only tests are `.dev/tests/*.test.js` (plain `node:test`, no deps), run with `pnpm test`. Prettier (with `prettier-plugin-tailwindcss`) runs on format-on-save and sorts `@apply`/class lists — don't hand-reorder them.

## CI

- `.github/workflows/ci.yml` (pushes to `master`, pull requests): Prettier check, `pnpm build` (tokens, contrast, Vite, built-CSS colours), `pnpm test` on that build; ShellCheck (`-S warning`) on `install.sh`, the `job` worker, uci-defaults and `.dev/scripts/*.sh`; those keep their executable bit; the versions agree.
- `.github/workflows/build.yml` (tags `v*`, or by hand for workflow artifacts only): checks the version, builds `htdocs/` once, packs it into the `.ipk` with `itdoginfo/openwrt-sdk-ipk:24.10.6` and the `.apk` with `itdoginfo/openwrt-sdk-apk:25.12.3`, and on a tag publishes the release with both packages, `sha256sums.txt` and `manifest.json`.

Local package build, the same way: `.dev/scripts/build-packages.sh [ipk|apk|all]` (`pnpm build:packages` from `.dev/`) — needs Docker; builds `htdocs/` first unless `SKIP_WEB=1`, writes `dist/`. `.dev/build/Dockerfile` copies only `Makefile`, `htdocs/`, `root/`, `ucode/` (`.dockerignore`) into the SDK's `package/feeds/luci/luci-theme-outline` and compiles that one package. Package files keep the SDK's names (`luci-theme-outline_<ver>-r<rel>_all.ipk`, `luci-theme-outline-<ver>-r<rel>.apk`): `install.sh` and the Package page match them and read the version from them.

## Releases

- `Makefile` (`PKG_VERSION` / `PKG_RELEASE`) is the OpenWrt package manifest, built via `feeds/luci/luci.mk`. Dependencies are runtime-only (`LUCI_EXTRA_DEPENDS`, `(>=0)` each): the SDK has nothing to build for them.
- A release is one commit on `master` titled `Outline X.Y.Z`; its body is `- ` points (wrapped lines indented), which become the GitHub release notes (`.dev/scripts/release-notes.sh`: the points of every commit since the previous tag, other commits by their title). There is no changelog folder. Work from a branch is squashed into that one commit.
- Bump `PKG_VERSION` in `Makefile` and `"version"` in `.dev/package.json` (CI checks they agree; the tag must be `v` + that version).
- No `Co-Authored-By` or other agent attribution in commits.
- Push `master`, then an annotated tag `vX.Y.Z` ("Outline X.Y.Z"); "Build packages" publishes the release.
- Re-cutting a release (fixes before anyone installs) rewrites `master`: force-push, `gh release delete vX.Y.Z --cleanup-tag`, cancel a running build of the old tag, tag again. Only with the user's go-ahead.
