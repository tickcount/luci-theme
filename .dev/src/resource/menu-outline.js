"use strict";
"require baseclass";
"require ui";
"require request";

return baseclass.extend({
  __init__() {
    ui.menu.load().then((tree) => this.render(tree));
    this.initMobileMenu();
    this.initUciIndicator();
    this.initVercelTabs();
    this.initTabContentAnimation();
    this.initCustomSelects();
    this.initCbiDropdownFix();
    this.initDescriptionPlacement();
    this.initTableOfContents();
    this.initToastAutoDismiss();
    this.initModalOverride();
  },

  initUciIndicator() {
    const original = ui.changes?.setIndicator;
    if (!original) return;

    ui.changes.setIndicator = function (n) {
      original.call(this, n);
      document
        .querySelector('[data-indicator="uci-changes"]')
        ?.setAttribute("data-count", n || 0);
    };
  },

  initModalOverride() {
    const origShow = ui.showModal;
    const origHide = ui.hideModal;
    if (!origShow || !origHide) return;

    let hideTimer = null;

    ui.showModal = function (title, children, ...classes) {
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      document.body.classList.remove("modal-overlay-exit");
      const dlg = origShow.call(this, title, children, ...classes);
      dlg.classList.remove("modal-exit");
      return dlg;
    };

    ui.hideModal = function () {
      const overlay = document.getElementById("modal_overlay");
      const dlg = overlay?.firstElementChild;
      if (!dlg || !document.body.classList.contains("modal-overlay-active")) {
        origHide.call(this);
        return;
      }

      dlg.classList.add("modal-exit");
      document.body.classList.add("modal-overlay-exit");

      const finish = () => {
        hideTimer = null;
        dlg.classList.remove("modal-exit");
        document.body.classList.remove("modal-overlay-exit");
        origHide.call(this);
      };

      hideTimer = setTimeout(finish, 180);
    };

    /* Override displayStatus to use toast instead of modal */
    const origDisplayStatus = ui.changes?.displayStatus;
    if (origDisplayStatus) {
      let statusToast = null;

      const hasButtons = (content) => {
        if (!content) return false;
        if (content.querySelector?.(".btn")) return true;
        if (Array.isArray(content))
          return content.some((c) => c?.querySelector?.(".btn"));
        return false;
      };

      const dismissStatusToast = () => {
        if (!statusToast || !statusToast.parentNode) return;
        statusToast.classList.add("toast-exit");
        statusToast.addEventListener(
          "animationend",
          () => statusToast.remove(),
          { once: true },
        );
        setTimeout(() => {
          if (statusToast?.parentNode) statusToast.remove();
        }, 400);
        statusToast = null;
      };

      ui.changes.displayStatus = function (type, content) {
        /* Interactive content (connectivity warning) → keep as modal */
        if (type && hasButtons(content)) {
          dismissStatusToast();
          origDisplayStatus.call(this, type, content);
          return;
        }

        /* Hide → dismiss toast */
        if (!type) {
          dismissStatusToast();
          if (this.was_polling) request.poll.start();
          return;
        }

        /* Show/update status toast */
        const container = document.getElementById("maincontent");
        if (!container) {
          origDisplayStatus.call(this, type, content);
          return;
        }

        if (!statusToast || !statusToast.parentNode) {
          statusToast = E("div", { class: "alert-message" });
          statusToast._toastInit = true;
          container.insertBefore(statusToast, container.firstChild);
        }

        /* Strip 'notice' so it renders as neutral toast, not warning */
        const classes = type
          .split(/\s+/)
          .filter((c) => c && c !== "notice");
        statusToast.className = "alert-message";
        if (classes.length)
          DOMTokenList.prototype.add.apply(statusToast.classList, classes);

        if (content) L.dom.content(statusToast, content);

        if (!this.was_polling) {
          this.was_polling = request.poll.active();
          request.poll.stop();
        }
      };
    }
  },

  initToastAutoDismiss() {
    const DISMISS_DELAY = 30000;
    const container = document.getElementById("maincontent");
    if (!container) return;

    const updateIndices = () => {
      const toasts = container.querySelectorAll(
        ":scope > .alert-message:not(.toast-exit)",
      );
      toasts.forEach((t, i) => {
        t.style.setProperty("--toast-index", i);
      });
    };

    const dismissToast = (toast) => {
      if (toast._toastDismissing) return;
      toast._toastDismissing = true;
      if (toast._toastTimer) clearTimeout(toast._toastTimer);

      toast.classList.add("toast-exit");
      toast.addEventListener(
        "animationend",
        () => {
          toast.remove();
          updateIndices();
        },
        { once: true },
      );

      /* Fallback removal if animation doesn't fire */
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
          updateIndices();
        }
      }, 400);
    };

    const setupToast = (toast) => {
      if (toast._toastInit) return;
      toast._toastInit = true;

      /* Recalculate stacking indices (newest = index 0 = top) */
      updateIndices();

      /* Auto-dismiss after delay */
      toast._toastTimer = setTimeout(() => dismissToast(toast), DISMISS_DELAY);

      /* Dismiss on close button click */
      const btn = toast.querySelector(".btn");
      if (btn) {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          dismissToast(toast);
        });
      }
    };

    /* Watch for new toasts added to #maincontent */
    new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (
            node.nodeType === 1 &&
            node.classList?.contains("alert-message") &&
            node.parentNode === container
          ) {
            setupToast(node);
          }
        }
      }
    }).observe(container, { childList: true });

    /* Setup any existing toasts */
    container
      .querySelectorAll(":scope > .alert-message")
      .forEach(setupToast);
  },

  initVercelTabs() {
    const bindTabMenu = (tabMenu) => {
      const items = Array.from(tabMenu.querySelectorAll("li"));
      if (!items.length) return;

      let activeReady = false;

      const updateActiveIndicator = () => {
        const active = tabMenu.querySelector("li.cbi-tab");
        if (!active) return;
        const menuRect = tabMenu.getBoundingClientRect();
        const activeRect = active.getBoundingClientRect();

        /* Skip transition on first placement so the underline appears instantly */
        if (!activeReady) {
          tabMenu.classList.add("tab-active-jump");
          void tabMenu.offsetWidth;
        }

        tabMenu.style.setProperty(
          "--tab-active-left",
          `${activeRect.left - menuRect.left}px`,
        );
        tabMenu.style.setProperty(
          "--tab-active-width",
          `${activeRect.width}px`,
        );
        tabMenu.style.setProperty(
          "--tab-active-top",
          `${activeRect.bottom - menuRect.top}px`,
        );

        if (!activeReady) {
          void tabMenu.offsetWidth;
          tabMenu.classList.remove("tab-active-jump");
          activeReady = true;
        }
      };

      let lastHoverTop = null;
      let hoverHideTimer = null;

      const updateHoverIndicator = (li) => {
        if (!li) {
          hoverHideTimer = setTimeout(() => {
            tabMenu.classList.remove("tab-hovering");
            lastHoverTop = null;
          }, 80);
          return;
        }
        if (hoverHideTimer) {
          clearTimeout(hoverHideTimer);
          hoverHideTimer = null;
        }
        const menuRect = tabMenu.getBoundingClientRect();
        const liRect = li.getBoundingClientRect();
        const newTop = liRect.top - menuRect.top;

        /* First hover (no previous position) or row jump — skip transition */
        const needsJump =
          lastHoverTop === null ||
          (lastHoverTop !== null && Math.abs(newTop - lastHoverTop) > 2);

        if (needsJump) {
          tabMenu.classList.add("tab-hover-jump");
          void tabMenu.offsetWidth;
        }

        tabMenu.style.setProperty(
          "--tab-hover-left",
          `${liRect.left - menuRect.left}px`,
        );
        tabMenu.style.setProperty("--tab-hover-width", `${liRect.width}px`);
        tabMenu.style.setProperty("--tab-hover-top", `${newTop}px`);
        tabMenu.classList.add("tab-hovering");

        if (needsJump) {
          void tabMenu.offsetWidth;
          tabMenu.classList.remove("tab-hover-jump");
        }

        lastHoverTop = newTop;
      };

      items.forEach((li) => {
        li.addEventListener("mouseenter", () => updateHoverIndicator(li));
      });
      tabMenu.addEventListener("mouseleave", () => updateHoverIndicator(null));

      const observer = new MutationObserver(updateActiveIndicator);
      items.forEach((li) =>
        observer.observe(li, { attributes: true, attributeFilter: ["class"] }),
      );

      requestAnimationFrame(updateActiveIndicator);

      let resizeTimer;
      window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(updateActiveIndicator, 100);
      });
    };

    const waitForTabs = new MutationObserver(() => {
      document.querySelectorAll(".cbi-tabmenu").forEach((menu) => {
        if (menu.dataset.vercelInit) return;
        menu.dataset.vercelInit = "1";
        bindTabMenu(menu);
      });
    });

    const target = document.getElementById("maincontent") || document.body;
    waitForTabs.observe(target, { childList: true, subtree: true });

    document.querySelectorAll(".cbi-tabmenu").forEach((menu) => {
      menu.dataset.vercelInit = "1";
      bindTabMenu(menu);
    });
  },

  initNavHover() {
    const nav = document.querySelector("#topmenu");
    if (!nav) return;

    const items = Array.from(nav.querySelectorAll(":scope > li"));
    if (!items.length) return;

    let hideTimer = null;
    let hasHovered = false;

    const show = (li) => {
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      const navRect = nav.getBoundingClientRect();
      const liRect = li.getBoundingClientRect();

      if (!hasHovered) {
        nav.classList.add("nav-hover-jump");
        void nav.offsetWidth;
      }

      nav.style.setProperty(
        "--nav-hover-left",
        `${liRect.left - navRect.left}px`,
      );
      nav.style.setProperty("--nav-hover-width", `${liRect.width}px`);
      nav.classList.add("nav-hovering");

      if (!hasHovered) {
        void nav.offsetWidth;
        nav.classList.remove("nav-hover-jump");
        hasHovered = true;
      }
    };

    const hide = () => {
      hideTimer = setTimeout(() => {
        nav.classList.remove("nav-hovering");
        hasHovered = false;
      }, 80);
    };

    items.forEach((li) => {
      li.addEventListener("mouseenter", () => show(li));
    });
    nav.addEventListener("mouseleave", hide);
  },

  initTabContentAnimation() {
    const target = document.getElementById("maincontent") || document.body;
    let animating = false;

    /* ── Content blur animation (fade in / out) ── */

    target.addEventListener(
      "click",
      (e) => {
        const link = e.target.closest(".cbi-tabmenu li a");
        if (!link || animating || e._tabAnimBypass) return;

        const clickedLi = link.closest("li");
        if (clickedLi?.classList.contains("cbi-tab")) return;

        const tabMenu = link.closest(".cbi-tabmenu");
        const section = tabMenu?.closest(".cbi-section, .cbi-map");
        const activePanel = section?.querySelector(
          "[data-tab-active='true'][data-tab-title]",
        );

        if (!activePanel) return;

        e.stopPropagation();
        e.preventDefault();
        animating = true;

        activePanel.classList.add("tab-content-exit");
        activePanel.addEventListener(
          "animationend",
          () => {
            activePanel.classList.remove("tab-content-exit");
            animating = false;

            const bypass = new MouseEvent("click", { bubbles: true });
            bypass._tabAnimBypass = true;
            link.dispatchEvent(bypass);
          },
          { once: true },
        );
      },
      true,
    );

    new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (
          m.type === "attributes" &&
          m.attributeName === "data-tab-active" &&
          m.target.getAttribute("data-tab-active") === "true" &&
          m.target.hasAttribute("data-tab-title")
        ) {
          m.target.classList.remove("tab-content-enter");
          void m.target.offsetWidth;
          m.target.classList.add("tab-content-enter");
          m.target.addEventListener(
            "animationend",
            () => m.target.classList.remove("tab-content-enter"),
            { once: true },
          );
        }
      });
    }).observe(target, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-tab-active"],
    });

    /* ── Container height animation (independent via ResizeObserver) ── */

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const el = entry.target;
        if (el._htLock) continue;

        const newH = Math.round(entry.borderBoxSize[0].blockSize);
        const oldH = el._htPrev;
        el._htPrev = newH;

        if (oldH === undefined || oldH === newH) continue;

        el._htLock = true;
        el.classList.add("tab-height-anim");
        el.style.height = oldH + "px";
        void el.offsetWidth;
        el.style.height = newH + "px";

        const done = () => {
          el.classList.remove("tab-height-anim");
          el.style.height = "";
          el._htLock = false;
        };

        const onEnd = (e) => {
          if (e.propertyName !== "height") return;
          el.removeEventListener("transitionend", onEnd);
          clearTimeout(tid);
          done();
        };

        el.addEventListener("transitionend", onEnd);
        const tid = setTimeout(() => {
          el.removeEventListener("transitionend", onEnd);
          done();
        }, 500);
      }
    });

    const watch = (c) => {
      if (c._htWatched) return;
      c._htWatched = true;
      ro.observe(c);
    };

    target
      .querySelectorAll(".cbi-section-node-tabbed, .cbi-map-tabbed")
      .forEach(watch);

    /* ── View load animation (blur-in after spinner) ── */

    const watchView = (v) => {
      if (v._viewWatched) return;
      v._viewWatched = true;

      new MutationObserver((muts) => {
        for (const m of muts) {
          for (const n of m.removedNodes) {
            if (!n.classList?.contains("spinning")) continue;
            v.classList.remove("tab-content-enter");
            void v.offsetWidth;
            v.classList.add("tab-content-enter");
            v.addEventListener(
              "animationend",
              () => v.classList.remove("tab-content-enter"),
              { once: true },
            );
            return;
          }
        }
      }).observe(v, { childList: true });
    };

    const view = document.getElementById("view");
    if (view) watchView(view);

    new MutationObserver((muts) => {
      for (const m of muts) {
        for (const n of m.addedNodes) {
          if (n.nodeType !== 1) continue;
          if (n.matches?.(".cbi-section-node-tabbed, .cbi-map-tabbed"))
            watch(n);
          n.querySelectorAll?.(".cbi-section-node-tabbed, .cbi-map-tabbed")
            .forEach(watch);
          if (n.id === "view") watchView(n);
        }
      }
    }).observe(target, { childList: true, subtree: true });
  },

  initDescriptionPlacement() {
    const move = () => {
      document
        .querySelectorAll(".cbi-value-field > .cbi-value-description")
        .forEach((desc) => {
          if (desc._aurMoved) return;
          desc._aurMoved = true;
          const row = desc.closest(".cbi-value");
          if (!row) return;
          const title = row.querySelector(".cbi-value-title");
          if (title) {
            title.appendChild(desc);
          }
        });
    };

    move();

    /* body, not #maincontent — form rows inside a modal live outside
       #maincontent, so their descriptions were only relocated whenever some
       unrelated poll mutated the page behind the modal. That showed up as the
       description jumping columns a moment after the modal opened. */
    new MutationObserver(() => requestAnimationFrame(move)).observe(
      document.body,
      { childList: true, subtree: true },
    );
  },

  /* Both dropdown widgets put their panel in the top layer and position it in
     viewport coordinates. Without this a panel is a normal absolutely
     positioned child, so a modal's own overflow box clips it, and LuCI's
     .cbi-dropdown and the theme's .outline-select end up placed by two
     different mechanisms on the same form. */
  hasPopover: () =>
    typeof HTMLElement !== "undefined" &&
    Object.prototype.hasOwnProperty.call(HTMLElement.prototype, "popover"),

  placePopover(panel, rect) {
    const set = (prop, value) => panel.style.setProperty(prop, value, "important");
    const GAP = 8;

    set("position", "fixed");
    set("margin", "0");
    /* The UA stylesheet gives popovers inset: 0; leaving `right` at 0 would
       stretch the panel to the far edge of the window. */
    set("right", "auto");
    panel.style.minWidth = `${rect.width}px`;
    panel.style.maxWidth = `${window.innerWidth - 16}px`;
    set("left", `${rect.left}px`);

    /* Flip above only when the panel genuinely does not fit below and there is
       more room above — decided from the panel's own height rather than a flat
       200px guess, which used to flip panels that fitted perfectly well and
       left them sitting on top of the field they belong to. */
    const panelH = panel.getBoundingClientRect().height || 0;
    const below = window.innerHeight - rect.bottom - GAP;
    const above = rect.top - GAP;
    const flip = panelH > below && above > below;

    if (flip) {
      set("top", "auto");
      set("bottom", `${Math.max(GAP, window.innerHeight - rect.top)}px`);
    } else {
      /* Keep the panel on screen even when its trigger is scrolled to the
         very edge, rather than letting it hang off. */
      const top = Math.min(rect.bottom, window.innerHeight - Math.min(panelH, window.innerHeight - GAP) - GAP);
      set("top", `${Math.max(GAP, top)}px`);
      set("bottom", "auto");
    }

    return flip;
  },

  /* Panels are often wider than their trigger, and width is only measurable
     once the panel is in the top layer. Re-align it then. */
  clampPopover(panel, rect) {
    const width = panel.getBoundingClientRect().width;
    if (!width) return;
    const maxLeft = window.innerWidth - width - 8;
    panel.style.setProperty(
      "left",
      `${Math.max(8, Math.min(rect.left, maxLeft))}px`,
      "important",
    );
  },

  closeAllDropdowns(except) {
    // Close all outline-selects
    document.querySelectorAll(".outline-select.open").forEach((s) => {
      if (s !== except) s.dispatchEvent(new CustomEvent("outline-select-close"));
    });
    // Close all cbi-dropdowns
    document.querySelectorAll(".cbi-dropdown[open]").forEach((d) => {
      if (d !== except) d.removeAttribute("open");
    });
  },

  initCustomSelects() {
    const replace = (sel) => {
      if (sel._outlineReplaced || sel.closest(".outline-select")) return;
      sel._outlineReplaced = true;

      const opts = Array.from(sel.options);
      if (!opts.length) return;

      const wrap = document.createElement("div");
      wrap.className = "outline-select";
      wrap.tabIndex = 0;
      if (sel.disabled) wrap.classList.add("disabled");

      const trigger = document.createElement("div");
      trigger.className = "outline-select-trigger";

      const val = document.createElement("span");
      val.className = "outline-select-value";
      val.textContent = sel.options[sel.selectedIndex]?.text || "";

      const chevron = document.createElement("span");
      chevron.className = "outline-select-chevron";

      trigger.append(val, chevron);

      const panel = document.createElement("div");
      panel.className = "outline-select-panel";
      if (this.hasPopover()) panel.setAttribute("popover", "manual");

      const buildOptions = () => {
        panel.innerHTML = "";
        Array.from(sel.options).forEach((opt) => {
          const item = document.createElement("div");
          item.className =
            "outline-select-option" +
            (opt.index === sel.selectedIndex ? " selected" : "");
          item.dataset.value = opt.value;
          item.dataset.index = opt.index;
          item.textContent = opt.text;
          item.addEventListener("click", (e) => {
            e.stopPropagation();
            sel.selectedIndex = opt.index;
            sel.dispatchEvent(new Event("change", { bubbles: true }));
            val.textContent = opt.text;
            panel
              .querySelectorAll(".selected")
              .forEach((o) => o.classList.remove("selected"));
            item.classList.add("selected");
            close();
          });
          panel.appendChild(item);
        });
      };

      buildOptions();
      wrap.append(trigger, panel);

      sel.style.display = "none";
      sel.insertAdjacentElement("afterend", wrap);

      let isOpen = false;

      const isPopover = () => panel.hasAttribute("popover");

      /* Follow the trigger per frame while open — see initCbiDropdownFix for
         why scroll and resize events alone leave the panel behind. */
      const reposition = () => {
        if (!isOpen || !isPopover()) return;
        const rect = wrap.getBoundingClientRect();
        panel.classList.toggle("above", this.placePopover(panel, rect));
        this.clampPopover(panel, rect);
        requestAnimationFrame(reposition);
      };

      const open = () => {
        if (isOpen || sel.disabled) return;
        this.closeAllDropdowns(wrap);
        isOpen = true;
        wrap.classList.add("open");
        const rect = wrap.getBoundingClientRect();

        if (isPopover()) {
          panel.classList.toggle("above", this.placePopover(panel, rect));
          try {
            panel.showPopover();
          } catch (e) {}
          this.clampPopover(panel, rect);
          requestAnimationFrame(reposition);
        } else {
          const below = window.innerHeight - rect.bottom;
          panel.classList.toggle("above", below < 200 && rect.top > 200);
        }

        const cur = panel.querySelector(".selected");
        if (cur) cur.scrollIntoView({ block: "nearest" });
      };

      const close = () => {
        if (!isOpen) return;
        isOpen = false;
        wrap.classList.remove("open");
        if (isPopover()) {
          try {
            panel.hidePopover();
          } catch (e) {}
        }
      };

      wrap.addEventListener("outline-select-close", close);

      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        isOpen ? close() : open();
      });

      document.addEventListener("click", (e) => {
        if (!wrap.contains(e.target)) close();
      });

      wrap.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          isOpen ? close() : open();
        } else if (e.key === "Escape") {
          close();
        } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          const items = Array.from(
            panel.querySelectorAll(".outline-select-option"),
          );
          const cur = panel.querySelector(".outline-select-option.selected");
          const idx = items.indexOf(cur);
          const next =
            e.key === "ArrowDown"
              ? Math.min(idx + 1, items.length - 1)
              : Math.max(idx - 1, 0);
          if (items[next]) items[next].click();
        }
      });

      // Sync if select changes externally
      new MutationObserver(() => {
        val.textContent = sel.options[sel.selectedIndex]?.text || "";
        buildOptions();
      }).observe(sel, { attributes: true, childList: true, subtree: true });
    };

    const replaceAll = () => {
      document.querySelectorAll("select").forEach(replace);
    };

    replaceAll();

    // Close outline-selects when cbi-dropdown opens
    document.addEventListener("click", (e) => {
      const openBtn = e.target.closest(".cbi-dropdown > .open");
      if (openBtn) {
        this.closeAllDropdowns(openBtn.closest(".cbi-dropdown"));
      }
    });

    /* body, not #maincontent — LuCI mounts #modal_overlay on body, so selects
       rendered inside a modal would keep their unstyled native look. */
    new MutationObserver(() => {
      requestAnimationFrame(replaceAll);
    }).observe(document.body, { childList: true, subtree: true });
  },

  /* LuCI's own dropdown positions its list itself, in the coordinate space of
     whatever container it sits in. Inside a modal that container has its own
     overflow box, which clips the list. Hand the list to the top layer and
     position it the same way .outline-select is positioned, so both widgets
     behave identically. */
  initCbiDropdownFix() {
    if (!this.hasPopover()) return;

    /* Hand the list back exactly as it was found. LuCI swaps the `dropdown`
       and `preview` classes between its two <ul>s as the widget opens and
       closes, so over one cycle both of them are, at some moment, `ul.dropdown`.
       Marking a list as a popover permanently therefore caught the closed-state
       value display too, which then floated free of the page — measured at
       x=3359 on a 2560px viewport, i.e. off screen entirely, and showing up as
       a stray label near the top of the window. */
    const release = (ul) => {
      if (!ul || !ul.hasAttribute("popover")) return;
      try {
        ul.hidePopover();
      } catch (e) {}
      ul.removeAttribute("popover");
      ul.classList.remove("cbi-dropdown-popover");
      [
        "position",
        "margin",
        "right",
        "left",
        "top",
        "bottom",
        "min-width",
        "max-width",
      ].forEach((p) => ul.style.removeProperty(p));
    };

    const updatePosition = (dropdown) => {
      const open = dropdown.hasAttribute("open");
      const list = open ? dropdown.querySelector("ul.dropdown") : null;

      /* Anything that is not the currently open list goes back to LuCI */
      dropdown.querySelectorAll("ul").forEach((ul) => {
        if (ul !== list) release(ul);
      });

      if (!list) return;

      if (!list.hasAttribute("popover")) {
        list.setAttribute("popover", "manual");
        list.classList.add("cbi-dropdown-popover");
      }

      const rect = dropdown.getBoundingClientRect();
      this.placePopover(list, rect);
      try {
        list.showPopover();
      } catch (e) {}
      this.clampPopover(list, rect);
    };

    new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.type !== "attributes" || m.attributeName !== "open") return;
        updatePosition(m.target);
        if (m.target.hasAttribute("open")) this.followCbiDropdowns();
      });
    }).observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ["open"],
    });

    /* Scroll and resize handlers are not enough: the page can move under an
       open panel without either firing — a sticky header collapsing, a poll
       reflowing the view, a nested container scrolling — and the panel is then
       left at a stale offset, which is how one ended up pinned to the top of
       the window while its field sat mid-page. Following per frame while
       something is open cannot fall behind, and costs nothing when nothing is
       open because the loop stops. */
    let following = false;
    const follow = () => {
      const open = document.querySelectorAll(".cbi-dropdown[open]");
      open.forEach((d) => updatePosition(d));
      following = open.length > 0;
      if (following) requestAnimationFrame(follow);
    };

    this.followCbiDropdowns = () => {
      if (following) return;
      following = true;
      requestAnimationFrame(follow);
    };

    window.addEventListener("resize", () => this.followCbiDropdowns());
  },

  initMobileMenu() {
    const overlay = document.querySelector("#mobile-menu-overlay");
    const menuToggle = document.querySelector("#mobile-menu-btn");
    const closeBtn = document.querySelector("#mobile-nav-close");

    if (!menuToggle || !overlay) return;

    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = overlay.classList.contains("mobile-menu-open");

      overlay.classList.toggle("mobile-menu-open", !isOpen);
      menuToggle.classList.toggle("active", !isOpen);
      menuToggle.setAttribute("aria-expanded", !isOpen);
      document.body.style.overflow = isOpen ? "" : "hidden";

      if (isOpen) {
        /* Reset mobile sidebar sections to default state when closing */
        overlay
          .querySelectorAll(".sidebar-section")
          .forEach((sec) => {
            const hasActive = sec.querySelector(".sidebar-link.active");
            sec.classList.toggle("expanded", !!hasActive);
          });
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", () => menuToggle.click());
    }

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) menuToggle.click();
    });

    document.addEventListener("keydown", (e) => {
      if (
        e.key === "Escape" &&
        overlay.classList.contains("mobile-menu-open")
      ) {
        menuToggle.click();
      }
    });

    /* Sidebar toggle clicks inside mobile panel are handled
       by each toggle's own listener (set in renderMobileMenu),
       using the same .expanded class + grid animation as desktop. */
  },

  renderMobileMenu(tree, url) {
    const list = document.querySelector("#mobile-nav-list");
    const children = ui.menu.getChildren(tree);

    if (!list || !children.length) return;

    list.innerHTML = "";

    /* Reuse exact same DOM structure as desktop sidebar */
    const sectionList = E("ul", { class: "sidebar-sections" });

    children.forEach((category) => {
      const subItems = ui.menu.getChildren(category);
      if (!subItems.length) return;

      const hasActive = category.name === L.env.dispatchpath[1];

      /* Chevron SVG — identical to renderFullSidebar */
      const chevron = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg",
      );
      chevron.setAttribute("viewBox", "0 0 16 16");
      chevron.setAttribute("width", "16");
      chevron.setAttribute("height", "16");
      chevron.setAttribute("fill", "currentColor");
      chevron.classList.add("sidebar-chevron");
      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path",
      );
      path.setAttribute(
        "d",
        "M4.646 5.646a.5.5 0 0 1 .708 0L8 8.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z",
      );
      chevron.appendChild(path);

      /* Toggle button */
      const toggle = E(
        "button",
        { class: "sidebar-toggle" + (hasActive ? " active" : "") },
        [_(category.title), chevron],
      );

      /* Sub-items list */
      const ul = E("ul", { class: "sidebar-list" });

      subItems.forEach((child) => {
        const itemUrl = L.url(url, category.name, child.name);
        const isActive =
          category.name === L.env.dispatchpath[1] &&
          child.name === L.env.dispatchpath[2];

        ul.appendChild(
          E("li", { class: "sidebar-item" + (isActive ? " active" : "") }, [
            E(
              "a",
              {
                class: "sidebar-link" + (isActive ? " active" : ""),
                href: itemUrl,
              },
              [_(child.title)],
            ),
          ]),
        );
      });

      /* Collapsible wrapper (grid trick — same as sidebar) */
      const listWrapper = E("div", { class: "sidebar-list-wrapper" }, [ul]);

      /* Section wrapper */
      const section = E(
        "li",
        { class: "sidebar-section" + (hasActive ? " expanded" : "") },
        [toggle, listWrapper],
      );

      /* Toggle click handler — same as sidebar */
      toggle.addEventListener("click", () => {
        section.classList.toggle("expanded");
      });

      sectionList.appendChild(section);
    });

    list.appendChild(sectionList);
  },

  render(tree) {
    this.renderModeMenu(tree);

    if (L.env.dispatchpath.length >= 3) {
      let node = tree;
      let url = "";

      for (let i = 0; i < 3 && node; i++) {
        const segment = L.env.dispatchpath[i];
        node = node.children?.[segment];
        url += (url ? "/" : "") + segment;
      }

      if (node) this.renderTabMenu(node, url);
    }

  },

  renderTabMenu(tree, url, level = 0) {
    const container = document.querySelector("#tabmenu");
    const ul = E("ul", { class: "tabs" });
    const children = ui.menu.getChildren(tree);
    let activeNode = null;

    children.forEach((child) => {
      const isActive = L.env.dispatchpath[3 + level] === child.name;

      ul.appendChild(
        E(
          "li",
          {
            class: `tabmenu-item-${child.name}${isActive ? " active" : ""}`,
          },
          [E("a", { href: L.url(url, child.name) }, [_(child.title)])],
        ),
      );

      if (isActive) activeNode = child;
    });

    if (!ul.children.length) return E([]);

    container.appendChild(ul);
    container.style.display = "";

    if (activeNode) {
      this.renderTabMenu(activeNode, `${url}/${activeNode.name}`, level + 1);
    }

    return ul;
  },

  renderMainMenu(tree, url) {
    const sidebar = document.querySelector("#sidebar");
    const children = ui.menu.getChildren(tree);

    if (!children.length || !sidebar) return;

    /* All navigation goes to sidebar with section groups */
    this.renderFullSidebar(children, url, sidebar);
  },

  renderFullSidebar(categories, baseUrl, sidebar) {
    const nav = E("nav", { class: "sidebar-nav" });
    const sectionList = E("ul", { class: "sidebar-sections" });

    categories.forEach((category) => {
      const subItems = ui.menu.getChildren(category);
      if (!subItems.length) return;

      const hasActive = category.name === L.env.dispatchpath[1];

      /* Chevron SVG */
      const chevron = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg",
      );
      chevron.setAttribute("viewBox", "0 0 16 16");
      chevron.setAttribute("width", "16");
      chevron.setAttribute("height", "16");
      chevron.setAttribute("fill", "currentColor");
      chevron.classList.add("sidebar-chevron");
      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path",
      );
      path.setAttribute(
        "d",
        "M4.646 5.646a.5.5 0 0 1 .708 0L8 8.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z",
      );
      chevron.appendChild(path);

      /* Toggle button */
      const toggle = E(
        "button",
        { class: "sidebar-toggle" + (hasActive ? " active" : "") },
        [_(category.title), chevron],
      );

      /* Sub-items list */
      const ul = E("ul", { class: "sidebar-list" });

      subItems.forEach((child) => {
        const isActive =
          category.name === L.env.dispatchpath[1] &&
          child.name === L.env.dispatchpath[2];

        ul.appendChild(
          E("li", { class: "sidebar-item" + (isActive ? " active" : "") }, [
            E(
              "a",
              {
                class: "sidebar-link" + (isActive ? " active" : ""),
                href: L.url(baseUrl, category.name, child.name),
              },
              [_(child.title)],
            ),
          ]),
        );
      });

      /* Collapsible wrapper (grid trick needs single child) */
      const listWrapper = E("div", { class: "sidebar-list-wrapper" }, [ul]);

      /* Section wrapper */
      const section = E(
        "li",
        { class: "sidebar-section" + (hasActive ? " expanded" : "") },
        [toggle, listWrapper],
      );

      /* Toggle click handler */
      toggle.addEventListener("click", () => {
        section.classList.toggle("expanded");
      });

      sectionList.appendChild(section);
    });

    nav.appendChild(sectionList);
    sidebar.appendChild(nav);

    /* Keep fixed nav aligned with its flex-child wrapper */
    const syncLeft = () => {
      nav.style.left = sidebar.getBoundingClientRect().left + "px";
    };
    syncLeft();
    window.addEventListener("resize", syncLeft);
  },

  initTableOfContents() {
    const tocContainer = document.querySelector("#toc-container");
    if (!tocContainer) return;

    let scrollCleanup = null;
    let prevKey = "";

    const clean = (s) => s.replace(/\s+/g, " ").trim();

    /* Section headings carry inline controls — the collapse toggle labelled
       "Hide", the poll indicator, status badges. Taking h3.textContent whole
       glued those in, which is where "SystemHide" came from. */
    const headingText = (h3) => {
      const copy = h3.cloneNode(true);
      copy
        .querySelectorAll(
          "svg, button, input, select, .label, .btn, .cbi-button, [data-clickable], [data-indicator], [data-tooltip]",
        )
        .forEach((el) => el.remove());
      /* A heading titled purely by a link keeps its full text as fallback */
      return clean(copy.textContent) || clean(h3.textContent);
    };

    /* "-" and friends carry no letters, so they cannot name a destination */
    const isUsableTitle = (text) => /[\p{L}\p{N}]/u.test(text);

    const buildToc = () => {
      const headings = document.querySelectorAll(
        "#view .cbi-section:not([data-tab-title]) > .cbi-title > h3, #view .cbi-section:not([data-tab-title]) > h3",
      );

      const entries = [];
      headings.forEach((h3) => {
        const title = headingText(h3);
        const section = h3.closest(".cbi-section");
        if (!section || !isUsableTitle(title)) return;
        /* A section LuCI renders but leaves empty — DSL on hardware that has
           none — is not a place you can scroll to. Listing it gave an entry
           that nudged the page a few pixels and highlighted nothing. */
        if (!section.offsetHeight) return;
        entries.push({ section, title });
      });

      /* Key on titles and on height, so the TOC is rebuilt when a section
         that was still empty at first paint gains content. */
      const key = entries.map((e) => e.title).join("|");
      if (key === prevKey) return; /* skip rebuild if headings unchanged */
      prevKey = key;

      if (entries.length < 2) {
        tocContainer.innerHTML = "";
        if (scrollCleanup) scrollCleanup();
        return;
      }

      tocContainer.innerHTML = "";

      const tocIcon = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg",
      );
      tocIcon.setAttribute("width", "16");
      tocIcon.setAttribute("height", "16");
      tocIcon.setAttribute("viewBox", "0 0 16 16");
      tocIcon.setAttribute("fill", "none");
      tocIcon.innerHTML =
        '<path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>';
      const heading = E("div", { class: "toc-heading" }, [
        tocIcon,
        "On this page",
      ]);
      const list = E("ul", { class: "toc-list" });

      const sectionElements = [];

      /* A click wins over the scroll position for as long as the smooth
         scroll runs, so the entry you picked is the one highlighted. */
      let pinnedIdx = -1;
      let pinnedUntil = 0;
      const pinIndex = (idx, ms) => {
        pinnedIdx = idx;
        pinnedUntil = performance.now() + ms;
        updateActive();
      };

      entries.forEach(({ section, title }, i) => {
        const id = "section-" + i;
        section.id = id;
        sectionElements.push(section);

        const link = E(
          "a",
          { class: "toc-link", href: "#" + id, "data-target": id },
          [title],
        );

        link.addEventListener("click", (e) => {
          e.preventDefault();
          const section = document.getElementById(id);
          if (!section) return;
          /* Scroll to the h3 heading, not the section container top */
          const el = section.querySelector("h3") || section;
          const headerOffset = 80;
          const targetY =
            el.getBoundingClientRect().top + window.scrollY - headerOffset;
          const startY = window.scrollY;
          const dist = targetY - startY;
          const dur = Math.min(600, 200 + Math.abs(dist) * 0.08);

          /* Clicking an entry must light it up even when the page cannot
             scroll far enough to bring that section past the fold — which is
             most of them on a short page. */
          pinIndex(i, dur + 150);

          if (Math.abs(dist) < 1) return;
          const t0 = performance.now();
          const step = (now) => {
            const p = Math.min((now - t0) / dur, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            window.scrollTo(0, startY + dist * ease);
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        });

        list.appendChild(E("li", { class: "toc-item" }, [link]));
      });

      /* Fixed inner wrapper (outer .docs-toc stretches with flex) */
      let tocInner = tocContainer.querySelector(".toc-inner");
      if (!tocInner) {
        tocInner = E("div", { class: "toc-inner" });
        tocContainer.appendChild(tocInner);

        /* Keep fixed toc aligned with its flex-child wrapper */
        tocInner._syncLeft = () => {
          tocInner.style.left = tocContainer.getBoundingClientRect().left + "px";
        };
        window.addEventListener("resize", tocInner._syncLeft);
      }
      tocInner.innerHTML = "";
      tocInner.appendChild(heading);
      tocInner.appendChild(list);

      /* Only now does .docs-toc match :has(.toc-link) and become visible, so
         only now does it have a real left edge. Measuring any earlier — as
         this did when the wrapper was first created — pinned the fixed panel
         to left: 0, i.e. the far side of the window. */
      tocInner._syncLeft();

      /* Scroll-spy via scroll event */
      const links = tocContainer.querySelectorAll(".toc-link");
      const headerOffset = 80;

      const getSectionTop = (el) => {
        let top = 0;
        while (el) {
          top += el.offsetTop;
          el = el.offsetParent;
        }
        return top;
      };

      const lastVisibleIdx = () => {
        for (let i = sectionElements.length - 1; i >= 0; i--)
          if (sectionElements[i]?.offsetHeight) return i;
        return 0;
      };

      const applyActive = (idx) =>
        links.forEach((l, i) => l.classList.toggle("active", i === idx));

      const updateActive = () => {
        if (performance.now() < pinnedUntil && pinnedIdx >= 0) {
          applyActive(pinnedIdx);
          return;
        }

        /* The fold sits a third of the way down the screen rather than just
           under the header. Measured on the firewall page: it scrolls 470px
           while its second section starts at 796px and its third at 1081px,
           so with a header-height threshold neither could ever be reached, no
           matter how far you scrolled. A proportional fold activates a section
           once it has climbed into view. */
        const fold =
          window.scrollY +
          Math.max(headerOffset + 20, window.innerHeight * 0.35);

        let activeIdx = 0;
        for (let i = 0; i < sectionElements.length; i++) {
          const s = sectionElements[i];
          if (!s || s.offsetHeight === 0) continue;
          if (getSectionTop(s) <= fold) activeIdx = i;
        }

        /* At the very bottom the remaining sections share one screenful and
           none of them will cross the fold — hand it to the last one. */
        const doc = document.documentElement;
        if (window.scrollY + window.innerHeight >= doc.scrollHeight - 2)
          activeIdx = lastVisibleIdx();

        applyActive(activeIdx);
      };

      if (scrollCleanup) scrollCleanup();
      window.addEventListener("scroll", updateActive, { passive: true });
      scrollCleanup = () =>
        window.removeEventListener("scroll", updateActive);

      updateActive();
    };

    /* Wait for view content to load, then build TOC.
       Observe only .docs-content (not #maincontent) to avoid triggering
       rebuilds when TOC/sidebar classes change — they live inside #maincontent
       but outside .docs-content. */
    const target =
      document.querySelector(".docs-content") ||
      document.getElementById("maincontent") ||
      document.body;
    let rafId = null;
    new MutationObserver(() => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = null;
        buildToc();
      });
    }).observe(target, { childList: true, subtree: true });

    requestAnimationFrame(buildToc);
  },

  renderModeMenu(tree) {
    const ul = document.querySelector("#modemenu");
    const children = ui.menu.getChildren(tree);
    let activeChild = null;

    children.forEach((child, index) => {
      const isActive = L.env.requestpath.length
        ? child.name === L.env.requestpath[0]
        : index === 0;

      ul.appendChild(
        E(
          "li",
          {
            class: isActive ? "active" : "",
          },
          [E("a", { href: L.url(child.name) }, [_(child.title)])],
        ),
      );

      if (isActive) activeChild = child;
    });

    if (activeChild) {
      this.renderMainMenu(activeChild, activeChild.name);
      this.renderMobileMenu(activeChild, activeChild.name);
    }

    if (ul.children.length > 1) {
      ul.style.display = "";
    }
  },
});
