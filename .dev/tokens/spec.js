/**
 * Copyright (C) 2025 eamonxg <eamonxiong@gmail.com>
 * Licensed under the Apache License, Version 2.0.
 */

// Operators: ['mix',a,b,p] ['shade',a,dl] ['set',a,L,C] ['alpha',a,p] ['const',str]
// 'const','var:x' aliases token x. Derived values resolve to flat oklch()
// literals; inputs (defaults.js) are emitted verbatim.
//
// The palette is literal (ChatGPT's measured values), so almost everything
// here is an alias: the shadcn-era names stay as stable consumer names for
// on-demand patches/*.css, login.css and the terminal log viewer.
const common = {
  background: ["const", "var:bg"],
  foreground: ["const", "var:text"],
  primary: ["const", "var:brand"],
  primary_foreground: ["const", "var:on_brand"],
  primary_hover: ["const", "var:brand_hover"],
  panel_bg: ["const", "var:surface"],
  panel_border: ["const", "var:border"],
  muted: ["const", "var:soft"],
  muted_foreground: ["const", "var:text_secondary"],
  input: ["const", "var:border_strong"],
  destructive: ["const", "var:danger"],
  destructive_fg: ["const", "oklch(1 0 0)"],
  success_fg: ["const", "oklch(1 0 0)"],
  info: ["const", "var:link"],
  warning_fg: ["const", "oklch(1 0 0)"],
  // Sidebar: ChatGPT's settings nav sits on the shell, items in full ink,
  // hover and the current page share one text-tinted fill.
  sidebar_bg: ["const", "var:shell"],
  sidebar_foreground: ["const", "var:text"],
  sidebar_muted: ["const", "var:text_secondary"],
  sidebar_accent: ["const", "var:hover"],
  sidebar_accent_fg: ["const", "var:text"],
  sidebar_active_bg: ["const", "var:hover"],
  sidebar_active_fg: ["const", "var:text"],
  // Log viewer (stock System/Kernel Log pages) as ChatGPT's code block:
  // neutral surface, plain ink.
  terminal_foreground: ["const", "var:text"],
  terminal_hover: ["const", "var:hover"],
};

export const DERIVATIONS = {
  light: {
    ...common,
    terminal_bg: ["const", "#f9f9f9"],
  },
  dark: {
    ...common,
    terminal_bg: ["const", "#0d0d0d"],
  },
};

// Baked-alpha variants. Each base (resolved per mode) is emitted at each alpha
// as a flat oklch(L C H / a) literal -> replaces Tailwind /NN opacity modifiers.
// Only opaque bases belong here: the alpha operator replaces (not multiplies)
// a base's own alpha, so a translucent token would come out wrong.
export const ALPHAS = {
  accent: [10, 30],
  destructive: [15, 20, 30],
  foreground: [5, 10, 30],
  success: [15],
  warning: [15],
  info: [15, 40],
  "elevated-secondary": [90],
};
