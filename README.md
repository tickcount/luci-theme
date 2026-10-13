<h4 align="right"><strong>English</strong> | <a href="README_zh.md">简体中文</a></h4>
<p align="center">
    <img src="https://raw.githubusercontent.com/tickcount/luci-theme/master/htdocs/luci-static/outline/images/logo.png" width="96" alt="Outline LuCI Theme"/>
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

Run these commands on the router itself (e.g. over an SSH session).

### Via a GitHub release

OpenWrt 25.12+ and snapshots use `apk`; older versions use `opkg`.

> **Tip**: Run `opkg --version` or `apk --version` to check which package manager your device has.

```sh
cd /tmp

# opkg
uclient-fetch -O luci-theme-outline.ipk https://github.com/tickcount/luci-theme/releases/latest/download/luci-theme-outline_1.0.3-r20261013_all.ipk
opkg install luci-theme-outline.ipk

# apk
uclient-fetch -O luci-theme-outline.apk https://github.com/tickcount/luci-theme/releases/latest/download/luci-theme-outline-1.0.3-r20261013.apk
apk add --allow-untrusted luci-theme-outline.apk
```

## Build from source

Build the package yourself with the OpenWrt build system. Host prerequisites: [Build system setup](https://openwrt.org/docs/guide-developer/toolchain/install-buildsystem). The build writes the package to `bin/packages/<arch>/base/` (e.g. `bin/packages/x86_64/base/luci-theme-outline_*_all.ipk`); copy it to your router and install it as above.

### Via the full source tree or SDK

Get set up — clone the full source tree:

```sh
# Full source tree — the openwrt-24.10 branch builds an .ipk, the main branch builds an .apk
git clone https://github.com/openwrt/openwrt.git
cd openwrt
git checkout openwrt-24.10
```

Or the [prebuilt SDK](https://openwrt.org/docs/guide-developer/toolchain/using_the_sdk) (faster: skips building the toolchain). Grab the archive for your target from [downloads.openwrt.org](https://downloads.openwrt.org), which splits SDKs into Release and Snapshot builds — Release 24.10.x and earlier build `.ipk`; Release 25.12+ and Snapshot build `.apk` (filename, arch and compression vary by target):

```sh
wget <sdk-archive-url-from-downloads.openwrt.org>
tar -xf openwrt-sdk-*.tar.*
cd openwrt-sdk-*/
```

Then, from that directory:

```sh
# Add this package and install feeds (provides luci-base)
git clone https://github.com/tickcount/luci-theme.git package/luci-theme-outline
./scripts/feeds update -a
./scripts/feeds install -a

# Select the theme in menuconfig: LuCI → Themes → luci-theme-outline
make menuconfig

# Skip these two lines with the SDK — it already ships a built toolchain
make tools/install -j$(nproc)
make toolchain/install -j$(nproc)

make package/luci-theme-outline/compile -j$(nproc) V=s
```

## License & Acknowledgments

[Apache 2.0](LICENSE). Thanks to:

- [luci-theme-shadcn](https://github.com/eamonxg/luci-theme-shadcn) — the theme Outline is forked from
- [shadcn/ui](https://github.com/shadcn-ui/ui) — the original design language
- [Lucide](https://github.com/lucide-icons/lucide) — icons
- [Linear](https://linear.app) — color system inspiration
- [Vite](https://vite.dev/) and [Tailwind CSS](https://tailwindcss.com/)
- [luci-theme-bootstrap](https://github.com/openwrt/luci/tree/master/themes/luci-theme-bootstrap) — template structure and LuCI integration patterns
- [luci-theme-material](https://github.com/openwrt/luci/tree/master/themes/luci-theme-material) — sidebar menu rendering approach
- [luci-theme-footstrap](https://github.com/VizzleTF/luci-theme-footstrap) — a LuCI theme with its own client-side router. The same-document navigation borrows some of its ideas and implements them on the Navigation API instead — see the [router doc](.dev/docs/router.md)
- [Claude Code](https://claude.ai/code)
