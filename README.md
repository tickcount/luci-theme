# Outline Theme

A modern OpenWrt LuCI theme. Fork of [luci-theme-aurora](https://github.com/eamonxg/luci-theme-aurora) with a massive visual overhaul.

Heavily inspired by [Claude Code docs](https://docs.anthropic.com/en/docs/claude-code), [Mintlify](https://mintlify.com) documentation layouts, and [21st.dev sign-in components](https://21st.dev/community/components/erikx/sign-in-flow-1/default).

## Preview

| Desktop | Tablet | Phone |
|---------|--------|-------|
| ![Desktop](preview/pc.png) | ![Tablet](preview/tablet.png) | ![Phone](preview/phone.png) |

https://github.com/user-attachments/assets/d3701be2-686f-48ec-b569-c7113755dba5

## What Changed

### Design
- New warm, neutral color palette replacing the cool blue-tinted scheme
- Calmer, less saturated tones across the entire interface
- Near-black dark mode instead of the previous teal-green

### Typography
- New font stack: Inter for UI, Aeonik Pro for headings, Geist Mono for code
- Lighter heading weights for a more refined feel
- Larger body text for better readability

### Layout
- Three-column docs-style layout: sidebar navigation, main content, and page table of contents
- Narrower content area for comfortable reading width
- Breadcrumb navigation on mobile showing current section and page

### Header
- Frosted glass header that becomes opaque on scroll
- Logo image next to device hostname
- Visible logout button on desktop
- Simple light/dark toggle replacing the three-way switcher

### Notifications
- Alert messages now appear as floating toasts in the top-right corner
- Toasts stack, animate in with a spring effect, and can be dismissed

### Controls
- Smaller, cleaner buttons with softer corners
- Boolean checkboxes restyled as pill toggle switches
- Dropdowns show a checkmark next to the selected item
- Smoother focus states on all inputs

### Transitions
- Smooth fade between pages via View Transitions API
- Animated color shift when switching between light and dark mode

### Login page
- Redesigned with a subtle dot-grid background pattern
- Cleaner card layout

### Removed
- Floating toolbar with quick-access icon buttons
- Mega-menu and boxed dropdown navigation
- Three-position theme switcher in footer

## Compatibility

- **OpenWrt** 23.05+
- **Chrome/Edge** 111+
- **Safari** 16.4+
- **Firefox** 128+

## Installation

OpenWrt 25.12+ and snapshots use `apk`; earlier versions use `opkg`.

**opkg** (OpenWrt &lt; 25.12):

```sh
cd /tmp && uclient-fetch -O luci-theme-outline.ipk \
  https://github.com/tickcount/luci-theme/releases/latest/download/luci-theme-outline_0.12.0-r20260304_all.ipk \
  && opkg install luci-theme-outline.ipk
```

**apk** (OpenWrt 25.12+):

```sh
cd /tmp && uclient-fetch -O luci-theme-outline.apk \
  https://github.com/tickcount/luci-theme/releases/latest/download/luci-theme-outline-0.12.0-r20260304.apk \
  && apk add --allow-untrusted luci-theme-outline.apk
```

## Development

Built with **Vite 7**, **Tailwind CSS v4**, and **pnpm**. See [Development docs](.dev/docs/DEVELOPMENT.md).

## License

Apache License 2.0. Based on [luci-theme-aurora](https://github.com/eamonxg/luci-theme-aurora) by eamonxg.
