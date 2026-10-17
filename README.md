<h4 align="right"><strong>English</strong> | <a href="README_zh.md">简体中文</a></h4>
<p align="center">
    <img src="https://raw.githubusercontent.com/tickcount/luci-theme-outline/master/.dev/public/outline/images/logo.png" width="96" alt="Outline LuCI Theme"/>
</p>
<p align="center"><strong>Outline — a ChatGPT-style LuCI theme for OpenWrt.</strong></p>
<div align="center">
  <a href="https://openwrt.org"><img alt="OpenWrt" src="https://img.shields.io/badge/OpenWrt-%E2%89%A523.05-00B5E2?logo=openwrt&logoColor=white"></a>
  <a href="https://github.com/tickcount/luci-theme/releases/latest"><img alt="GitHub release" src="https://img.shields.io/github/v/release/tickcount/luci-theme"></a>
  <a href="https://github.com/tickcount/luci-theme/releases"><img alt="Downloads" src="https://img.shields.io/github/downloads/tickcount/luci-theme/total"></a>
</div>

<p align="center">
  <img src=".github/preview/hero.png" alt="Outline — light and dark" width="100%">
</p>

## Features

- **Sidebar layout**: ChatGPT-style icon rail plus a panel showing one section at a time, collapsible, with a mobile drawer.
- **Fast, silky navigation**: On supported browsers, switching pages only updates the content instead of reloading the whole page, so moving between pages feels seamless and loads much faster (see the [router doc](.dev/docs/router.md)). This no-reload page-switching took cues from [luci-theme-footstrap](https://github.com/VizzleTF/luci-theme-footstrap).
- **Dark / Light mode**: Built-in toggle, preference remembered automatically, flash-free restore on load.
- **Command palette (⌘K)**: ChatGPT-style search dialog — jump to any page or tab from the sidebar.
- **ChatGPT-style design**: ChatGPT settings look — pill controls, hairline cards, secondary-ink descriptions, Analytics-style charts and legends.
- **Modern stack**: Fast to load, smooth to navigate, with carefully chosen typography and icons.

## Preview

<table>
  <tr>
    <td><img src=".github/preview/mounts.png" alt="Mount Points"></td>
    <td><img src=".github/preview/login.png" alt="Login"></td>
  </tr>
  <tr>
    <td><img src=".github/preview/analytics.png" alt="Realtime charts"></td>
    <td><img src=".github/preview/palette.png" alt="Command palette"></td>
  </tr>
  <tr>
    <td><img src=".github/preview/interfaces.png" alt="Interfaces"></td>
    <td><img src=".github/preview/rules.png" alt="Firewall rules"></td>
  </tr>
  <tr>
    <td><img src=".github/preview/wireless.png" alt="Wireless"></td>
    <td><img src=".github/preview/load.png" alt="Load chart"></td>
  </tr>
</table>

<p align="center">
  <img src=".github/preview/mobile.png" alt="Mobile" width="100%">
</p>

## Compatibility

- **OpenWrt**: Requires OpenWrt 23.05.0 or later (ucode templates + LuCI JavaScript APIs).
- **Browsers**: Built with **TailwindCSS v4**. Compatible with the following modern browsers:
  - **Chrome/Edge 111+** _(released March 2023)_
  - **Safari 16.4+** _(released March 2023)_
  - **Firefox 128+** _(released July 2024)_
  - _Optional enhancement, not a requirement:_ same-document navigation (no full page reload between view pages) uses the [Navigation API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API) where available — Chrome/Edge 105+, Safari 26.2+, Firefox 147+. Browsers without it keep classic full-page navigation automatically, with no loss of function.

## Installation

Run this on the router itself (e.g. over an SSH session):

```sh
wget -qO- https://raw.githubusercontent.com/tickcount/luci-theme-outline/master/install.sh | sh
```

The script picks the `.ipk` (opkg, OpenWrt ≤ 24.10) or `.apk` (apk, 25.12+) from the latest release, verifies its checksum, installs it and makes Outline the active LuCI theme. Run it again to update. To remove the theme, pass an option after `sh -s --`:

```sh
wget -qO- https://raw.githubusercontent.com/tickcount/luci-theme-outline/master/install.sh | sh -s -- --uninstall
```

| Option          | Effect                                                       |
| :-------------- | :----------------------------------------------------------- |
| `--no-activate` | install without switching LuCI to Outline                    |
| `--uninstall`   | remove the theme; its settings stay in `/etc/config/outline` |
| `--purge`       | remove the theme, its settings and uploaded brand images     |

After that, updates, switching the theme on or off and removal are in LuCI under **System › Outline Theme › Package**.

## Settings

**System › Outline Theme** — the theme's own settings, after ChatGPT/Codex _Settings › Appearance_:

- **Appearance** — Mode (System / Light / Dark), a theme preset (Outline, ChatGPT and the Codex collection: Absolutely, Ayu, Catppuccin, Dracula, Everforest, GitHub, Gruvbox, Linear, Nord, Rose Pine, Solarized, Tokyo Night, Vercel, …), accent, background and foreground colours with a colour picker, fonts, UI / content / code font sizes, contrast, reduce motion, and separate light and dark themes. Themes copy and import as `outline-theme-v1:` strings; Codex `codex-theme-v1:` strings import too.
- **Branding** — the logo (Outline, OpenWrt's, or an upload) and one app icon from which every favicon and home-screen size is generated.
- **Package** — check for updates, update, switch LuCI to or away from Outline, uninstall.

Changes preview on the settings page only and are stored with LuCI's own **Save** / **Save & Apply**. How it works: [.dev/docs/settings.md](.dev/docs/settings.md).

## Build from source

`htdocs/` is not in git: the theme's CSS and JS are built from `.dev/` with [pnpm](https://pnpm.io) (Node 22+) first, then the OpenWrt SDK packs them.

### With Docker (as the release does)

```sh
git clone https://github.com/tickcount/luci-theme-outline.git
cd luci-theme-outline
.dev/scripts/build-packages.sh        # or: ipk | apk
```

It builds `htdocs/`, then the `.ipk` (OpenWrt 24.10 SDK) and the `.apk` (25.12 SDK) in Docker, and writes them with `sha256sums.txt` to `dist/`.

### In your own source tree or SDK

From an OpenWrt source tree or [SDK](https://openwrt.org/docs/guide-developer/toolchain/using_the_sdk) with the feeds installed (24.10 and earlier build `.ipk`, 25.12+ `.apk`):

```sh
git clone https://github.com/tickcount/luci-theme-outline.git package/luci-theme-outline
(cd package/luci-theme-outline/.dev && pnpm install --frozen-lockfile && pnpm build)
./scripts/feeds update -a && ./scripts/feeds install -a
make menuconfig    # LuCI → Themes → luci-theme-outline
make package/luci-theme-outline/compile V=s
```

The package lands in `bin/packages/<arch>/base/`; copy it to the router and install it with opkg or apk.

## License & Acknowledgments

[Apache 2.0](LICENSE). Thanks to:

- [luci-theme-shadcn](https://github.com/eamonxg/luci-theme-shadcn) — the theme Outline is forked from
- [shadcn/ui](https://github.com/shadcn-ui/ui) — the original design language
- [Lucide](https://github.com/lucide-icons/lucide) — icons
- [Twemoji](https://github.com/twitter/twemoji) — country flags on systems without them (CC-BY 4.0, via [country-flag-emoji-polyfill](https://github.com/talkjs/country-flag-emoji-polyfill))
- [Linear](https://linear.app) — color system inspiration
- [Vite](https://vite.dev/) and [Tailwind CSS](https://tailwindcss.com/)
- [luci-theme-bootstrap](https://github.com/openwrt/luci/tree/master/themes/luci-theme-bootstrap) — template structure and LuCI integration patterns
- [luci-theme-material](https://github.com/openwrt/luci/tree/master/themes/luci-theme-material) — sidebar menu rendering approach
- [luci-theme-footstrap](https://github.com/VizzleTF/luci-theme-footstrap) — a LuCI theme with its own client-side router. The same-document navigation borrows some of its ideas and implements them on the Navigation API instead — see the [router doc](.dev/docs/router.md)
- [Claude Code](https://claude.ai/code)
