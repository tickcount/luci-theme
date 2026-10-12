"use strict";
/* nlbwmon Display: its doughnuts are Chart.js v1 canvases drawn from a data
   array whose colours nlbw picks itself (an hsl red→green ramp), so CSS
   cannot reach them. This patch wraps Chart.prototype.Doughnut to repaint
   the segments in ChatGPT's chart palette, split them with the page canvas
   colour and thin the ring — the chart, data, labels and tooltips are
   nlbw's own. Chart.js may load after this patch (nlbw requires it from its
   view), so the wrap also runs from the script's load. */
(function () {
  // ChatGPT's brand-400 sequence (blue first, as its usage charts lead).
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
  let inner = null; // Chart.js's own Doughnut, once it defines it
  let proto = null;

  function themed(data, options) {
    (data || []).forEach((seg, i) => {
      seg.color = seg.highlight = PALETTE[i % PALETTE.length];
    });
    const canvas =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--background")
        .trim() || "#000";
    return inner.call(
      this,
      data,
      Object.assign({}, options, {
        segmentStrokeColor: canvas,
        segmentStrokeWidth: 2,
        percentageInnerCutout: 62,
      }),
    );
  }

  function wrap() {
    const C = window.Chart;
    if (!C?.prototype?.Doughnut || proto) return;
    proto = C.prototype;
    inner = proto.Doughnut;
    proto.Doughnut = themed;
  }

  // nlbw draws from its <script src=nlbw.chart.min.js>'s load handler. A
  // capture-phase load listener on the document runs before that target
  // handler, when Chart.js is fully defined — wrap there (or right away if
  // the library is already in).
  function onLoad(e) {
    if (String(e.target?.src || "").includes("nlbw.chart")) wrap();
  }

  function mount() {
    wrap();
    document.addEventListener("load", onLoad, true);
  }

  function unmount() {
    document.removeEventListener("load", onLoad, true);
    if (proto && inner) proto.Doughnut = inner;
    proto = inner = null;
  }

  // Page-scoped lifecycle for the router (see .dev/docs/router.md);
  // a full load simply mounts once.
  (window.luciPatches ??= {})["admin-services-nlbw-display"] = {
    mount,
    unmount,
  };
  mount();
})();
