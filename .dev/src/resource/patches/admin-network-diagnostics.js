"use strict";
/* Network › Diagnostics: the view renders its 20-row output textarea before
   any command has run — a tall empty terminal under the three forms. A blank
   placeholder lets the stylesheet hide it while it holds no output
   (:placeholder-shown, patches/admin-network-diagnostics.css); fs.exec
   writes .value and the box comes back with the result. The view renders
   after this script evaluates, so mount waits for the textarea. */
(function () {
  const SEL = 'textarea[id="widget.command-output"]';
  let observer = null;

  function mark() {
    const out = document.querySelector(SEL);
    if (out && !out.hasAttribute("placeholder"))
      out.setAttribute("placeholder", " ");
    return !!out;
  }

  function mount() {
    if (observer || mark()) return;
    observer = new MutationObserver(() => {
      if (mark()) unwatch();
    });
    observer.observe(document.getElementById("maincontent") || document.body, {
      childList: true,
      subtree: true,
    });
  }

  function unwatch() {
    observer?.disconnect();
    observer = null;
  }

  function unmount() {
    unwatch();
    document.querySelector(SEL)?.removeAttribute("placeholder");
  }

  // Page-scoped lifecycle for the router (see .dev/docs/router.md);
  // a full load simply mounts once.
  (window.luciPatches ??= {})["admin-network-diagnostics"] = {
    mount,
    unmount,
  };
  mount();
})();
