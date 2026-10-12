"use strict";
/* Statistics › Graphs: the timespan picker is a <select> plus a "Display
   timespan »" button. ChatGPT's Usage › Analytics picks its range with a
   segmented control (7d / 30d), so this patch lays one over the select:
   each segment writes its option into the select and presses LuCI's own
   button, which stays the only code path that re-renders the graphs. The
   select and button remain in the DOM (hidden), so host/refresh controls,
   polling and resize keep reading the select as before. */
(function () {
  const ATTR = "data-segmented";
  let seg = null;
  let host = null;
  let observer = null;

  function sync() {
    if (!seg || !host) return;
    const sel = host.querySelector('select[data-name="timespan"]');
    for (const b of seg.children)
      b.setAttribute("aria-pressed", String(b.value === sel?.value));
  }

  function build() {
    const sel = document.querySelector('#view select[data-name="timespan"]');
    const btn = sel?.nextElementSibling;
    if (!sel || seg || !btn || sel.options.length < 2) return !!seg;

    host = sel.parentElement;
    seg = document.createElement("div");
    seg.className = "stat-segmented";
    seg.setAttribute("role", "group");
    seg.setAttribute("aria-label", btn.textContent.replace(/\s*»\s*$/, ""));
    for (const o of sel.options) {
      const b = document.createElement("button");
      b.type = "button";
      b.value = o.value;
      b.textContent = o.textContent;
      b.addEventListener("click", () => {
        if (sel.value === o.value) return;
        sel.value = o.value;
        sync();
        btn.click();
      });
      seg.appendChild(b);
    }
    host.setAttribute(ATTR, "");
    host.insertBefore(seg, sel);
    sync();
    return true;
  }

  function mount() {
    if (build()) return;
    // The view renders asynchronously: wait for its controls.
    observer = new MutationObserver(() => {
      if (build()) {
        observer.disconnect();
        observer = null;
      }
    });
    observer.observe(document.getElementById("view") || document.body, {
      childList: true,
      subtree: true,
    });
  }

  function unmount() {
    observer?.disconnect();
    observer = null;
    seg?.remove();
    host?.removeAttribute(ATTR);
    seg = host = null;
  }

  // Page-scoped lifecycle for the router (see .dev/docs/router.md);
  // a full load simply mounts once.
  (window.luciPatches ??= {})["admin-statistics-graphs"] = { mount, unmount };
  mount();
})();
