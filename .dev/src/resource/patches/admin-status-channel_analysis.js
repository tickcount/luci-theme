"use strict";
/* Status › Channel Analysis: every scanned network gets a colour from
   tools.prng's derive_color(bssid) — random pastels that the view writes
   inline into its graph polygon, label and table dot. This patch swaps that
   one function for ChatGPT's chart palette, handed out in first-seen order
   so neighbouring networks never share a hue while there are colours left.
   The view's own scan cache keeps each network's colour across refreshes;
   unmount restores LuCI's function. */
(function () {
  // ChatGPT's brand-400 sequence, as in the nlbw doughnut patch.
  const PALETTE = [
    "#3a83f7",
    "#04bb9f",
    "#ff8066",
    "#a25bff",
    "#fa70ab",
    "#ffcc38",
    "#00b1ff",
    "#dd6adc",
    "#b6d80b",
    "#7c9cc3",
    "#fa423e",
  ];
  let prng = null;
  let inner = null;
  const seen = new Map();

  function themed(key) {
    if (!seen.has(key)) seen.set(key, PALETTE[seen.size % PALETTE.length]);
    return seen.get(key);
  }

  function mount() {
    if (prng || !window.L?.require) return;
    L.require("tools.prng").then((m) => {
      if (prng || typeof m?.derive_color !== "function") return;
      prng = m;
      inner = m.derive_color;
      m.derive_color = themed;
    });
  }

  function unmount() {
    if (prng && inner) prng.derive_color = inner;
    prng = inner = null;
    seen.clear();
  }

  // Page-scoped lifecycle for the router (see .dev/docs/router.md);
  // a full load simply mounts once.
  (window.luciPatches ??= {})["admin-status-channel_analysis"] = {
    mount,
    unmount,
  };
  mount();
})();
