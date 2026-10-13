"use strict";
"require baseclass";

const THEME_KEY = "outline.theme";
const SIDEBAR_KEY = "outline.sidebar";

return baseclass.extend({
  __init__() {
    const sidebar = document.getElementById("sidebar");
    if (sidebar?.getAttribute("data-outline-built") === "1") {
      this._start();
      return;
    }

    document.addEventListener("outline-sidebar-ready", () => this._start(), {
      once: true,
    });
  },

  _start() {
    if (this._started) return;
    const sidebar = document.getElementById("sidebar");
    if (sidebar?.getAttribute("data-outline-built") !== "1") return;
    this._started = true;

    this.initTheme();
    this.initSidebar();
    this.initMobileDrawer();
    this.initThemeToggle();
    this.initTabReveal();
    this.initDropdownClamp();
  },

  /* ── Tab rows ── */

  // Phones show a tab row as one swipeable line: centre its selected tab,
  // or a page opened on a later tab (Administration › HTTP(S) Access, a
  // remembered DHCP section tab) shows a row whose selection is off the
  // edge. Page tabs mark it li.active, section tabs (ui.tabs) li.cbi-tab,
  // on render and on every switch. Horizontal only: the page never scrolls.
  initTabReveal() {
    const main = document.getElementById("maincontent");
    if (!main) return;
    const sel = ".tabs > li.active, .cbi-tabmenu > li.cbi-tab";
    const reveal = (li) => {
      const row = li.parentElement;
      if (row.scrollWidth <= row.clientWidth) return;
      const at =
        li.getBoundingClientRect().left - row.getBoundingClientRect().left;
      row.scrollLeft += at - (row.clientWidth - li.offsetWidth) / 2;
    };
    const scan = (n) => {
      if (n.matches?.(sel)) reveal(n);
      n.querySelectorAll?.(sel).forEach(reveal);
    };
    scan(main);
    new MutationObserver((records) => {
      for (const r of records)
        if (r.type === "attributes") scan(r.target);
        else r.addedNodes.forEach(scan);
    }).observe(main, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["class"],
    });
  },

  /* ── Dropdown menus ── */

  // LuCI places an open ui.Dropdown list only vertically (top/bottom and
  // max-height; on touch screens it spans the viewport). Horizontally it
  // hangs off the trigger's left edge and grows with its longest item, so
  // a right-hand select (Firewall › Flow offloading type) ran past the
  // viewport. Once open, cap it to the visible area less a 16px gutter
  // each side and nudge it back inside with `translate` — properties LuCI
  // never writes, so its own positioning stays intact.
  initDropdownClamp() {
    const clamp = (sb) => {
      // The list is the first ul (LuCI inserts its .preview clone after
      // it) and carries .dropdown only while open — found by that class,
      // a closed trigger kept the shift and its value slid out of it.
      const ul = sb.querySelector(":scope > ul");
      const s = ul?.style;
      if (!s) return;
      s.translate = s.maxWidth = "";
      if (!ul.classList.contains("dropdown")) return;
      // LuCI's touch path (any 'ontouchstart' browser, desktops included)
      // stretches the list across the viewport with inline left/right;
      // like Codex's menus it hangs from its own trigger instead.
      s.left = s.right = "";
      // Inside the box that clips it (the scrolling #maincontent, a
      // dialog; both lie within the viewport): pushed past its left edge,
      // the list was cut off under the sidebar.
      const c = (
        sb.closest(".modal") || document.getElementById("maincontent")
      ).getBoundingClientRect();
      const lo = c.left + 16;
      const hi = c.right - 16;
      s.maxWidth = `${hi - lo}px`;
      const r = ul.getBoundingClientRect();
      const dx = Math.max(Math.min(0, hi - r.right), lo - r.left);
      if (dx) s.translate = `${dx}px 0`;
    };
    // Applied and undone in the observer's microtask, before the frame is
    // painted: deferred to rAF, an opening list showed a frame at LuCI's
    // spot and a closing one's value a frame shifted. Re-checked two frames
    // on, once LuCI has sized the list's height (a scrollbar can appear).
    new MutationObserver((records) =>
      records.forEach(({ target: t }) => {
        if (!t.classList.contains("cbi-dropdown")) return;
        clamp(t);
        if (t.hasAttribute("open"))
          requestAnimationFrame(() => requestAnimationFrame(() => clamp(t)));
      }),
    ).observe(document.body, { subtree: true, attributeFilter: ["open"] });
    // That touch path closes an open list only on a touchstart outside it:
    // a touch-capable desktop browser driven by a mouse (Brave on a Mac)
    // never sends one, so a click outside left the list open for good.
    // Clicks inside a list never get here: LuCI stops them at its trigger.
    addEventListener("click", () =>
      L.ui?.Dropdown?.prototype.closeAllDropdowns(),
    );
  },

  /* ── Theme ── */

  initTheme() {
    this.applyTheme(localStorage.getItem(THEME_KEY), 1);
  },

  // No stored choice -> the router default header.ut emits (Appearance ›
  // Mode); `keep` re-applies without pinning this browser to it.
  applyTheme(theme, keep) {
    theme ||= document.documentElement.dataset.defaultTheme;
    const isDark =
      theme === "dark" ||
      (theme !== "light" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.setAttribute("data-darkmode", isDark);
    keep || localStorage.setItem(THEME_KEY, theme);
  },

  initThemeToggle() {
    const btn = document.getElementById("theme-toggle-btn");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const isDark =
        document.documentElement.getAttribute("data-darkmode") === "true";
      this.applyTheme(isDark ? "light" : "dark");
    });
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () =>
        this.applyTheme(localStorage.getItem(THEME_KEY), 1),
      );
  },

  /* ── Sidebar collapse (desktop icon rail) ── */

  initSidebar() {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return;

    const bp = getComputedStyle(document.documentElement)
      .getPropertyValue("--breakpoint-md")
      .trim();
    this._mobileQuery = window.matchMedia(`(width < ${bp})`);
    this._mobileQuery.addEventListener("change", (e) => {
      if (!e.matches) this._hideCollapsedPopover();
    });

    // header.ut's pre-paint state: never collapsed as a navbar.
    const collapsed =
      document.documentElement.dataset.sidebarCollapsed == "true";
    sidebar.setAttribute("data-collapsed", collapsed);

    const toggleBtn = document.getElementById("sidebar-toggle-btn");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        if (this._mobileQuery.matches) {
          this.closeDrawer();
        } else {
          this.toggleCollapse();
        }
      });
    }

    // Collapsed on desktop, the rail's logo expands the panel again.
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".sidebar-rail-home")) return;
      if (this._mobileQuery.matches) return;
      if (sidebar.getAttribute("data-collapsed") !== "true") return;
      e.preventDefault();
      this.toggleCollapse();
    });

    this._initAccordion();
    this._initCollapsedPopover();

    // Navbar: room the pill row needs either side of the centre, so the
    // side pills leave the content column's edge only when they must; a
    // row too wide for the window even at 12px edges drops its labels.
    // Measured with labels each time, so the choice can't oscillate.
    const fit = () => {
      const d = document.documentElement;
      const w = (s) => document.querySelector(s)?.offsetWidth || 0;
      const need = () =>
        w(".sidebar-rail-nav") / 2 +
        Math.max(w(".sidebar-rail-home"), w(".card-header-right") + 96) +
        8;
      d.removeAttribute("data-nav-compact");
      d.toggleAttribute("data-nav-compact", need() * 2 + 24 > innerWidth);
      d.style.setProperty("--nav-reserve", need() + "px");
    };
    const ro = new ResizeObserver(fit);
    document
      .querySelectorAll(
        ".sidebar-rail-nav,.sidebar-rail-home,.card-header-right",
      )
      .forEach((e) => ro.observe(e));
    addEventListener("resize", () => {
      fit();
      this._hideCollapsedPopover();
    });

    // The navbar's blurred fade shows once the page column has scrolled.
    addEventListener(
      "scroll",
      (e) =>
        e.target.id == "maincontent" &&
        document.documentElement.toggleAttribute(
          "data-scrolled",
          e.target.scrollTop > 0,
        ),
      true,
    );
  },

  toggleCollapse() {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return;
    const next = sidebar.getAttribute("data-collapsed") !== "true";
    sidebar.setAttribute("data-collapsed", next);
    document.documentElement.setAttribute(
      "data-sidebar-collapsed",
      next ? "true" : "false",
    );
    document.documentElement.setAttribute("data-sidebar-anim", "");
    localStorage.setItem(SIDEBAR_KEY, next);

    this._hideCollapsedPopover();

    // Expanding reveals a panel that had no height while hidden: bring the
    // current page into view the way menu-outline.js does on a build.
    if (!next) {
      const nav = document.getElementById("sidebar-nav");
      const cur = nav?.querySelector(".sidebar-sub-item.active");
      if (cur && cur.offsetTop + cur.offsetHeight > nav.clientHeight)
        nav.scrollTop = cur.offsetTop - nav.clientHeight / 3;
    }
  },

  /* ── Collapsed hover popover ── */

  // Page lists pop over the rail when the panel is not there to show them:
  // a collapsed sidebar, or the navbar layout (Appearance › Navigation).
  _pops() {
    return (
      document.getElementById("sidebar")?.getAttribute("data-collapsed") ==
        "true" || this._navbar()
    );
  },

  _navbar() {
    return (
      document.documentElement.dataset.nav == "navbar" &&
      !this._mobileQuery.matches
    );
  },

  _initCollapsedPopover() {
    document.addEventListener("mouseover", (e) => {
      if (!this._pops()) return;

      if (e.target.closest("#sidebar-collapsed-popover")) {
        clearTimeout(this._popoverTimer);
        return;
      }

      // Collapsed, only the rail shows: hovering a section's rail button
      // lists that section's pages beside it.
      const item = e.target.closest(".sidebar-rail-item");
      if (item) {
        clearTimeout(this._popoverTimer);
        this._showCollapsedPopover(item);
      }
    });

    document.addEventListener("mouseout", (e) => {
      if (!this._pops()) return;

      const isFromRelevant =
        e.target.closest(".sidebar-rail-item") ||
        e.target.closest("#sidebar-collapsed-popover");
      if (!isFromRelevant) return;

      const to = e.relatedTarget;
      const isToRelevant =
        to &&
        (to.closest(".sidebar-rail-item") ||
          to.closest("#sidebar-collapsed-popover"));

      if (!isToRelevant) {
        this._popoverTimer = setTimeout(
          () => this._hideCollapsedPopover(),
          100,
        );
      }
    });
  },

  _showCollapsedPopover(railItem) {
    const section = railItem.getAttribute("data-section") || "";
    const existing = document.getElementById("sidebar-collapsed-popover");
    if (existing && existing.getAttribute("data-section") === section) return;

    this._hideCollapsedPopover();

    // The pages come from the (hidden) panel group of the same section.
    const item = document.querySelector(
      `.sidebar-accordion-item[data-section="${section}"]`,
    );
    const links = item ? item.querySelectorAll(".sidebar-sub-link") : [];
    if (!links.length) return;

    const label = item.querySelector(".sidebar-label");
    const title = label ? label.textContent.trim() : "";

    const popover = document.createElement("div");
    popover.id = "sidebar-collapsed-popover";
    popover.className = "sidebar-collapsed-popover";
    popover.setAttribute("data-section", section);

    if (title) {
      const h = document.createElement("div");
      h.className = "sidebar-collapsed-popover-title";
      h.textContent = title;
      popover.appendChild(h);
    }

    const ul = document.createElement("ul");
    ul.className = "sidebar-collapsed-popover-list";

    links.forEach((link) => {
      const isActive = link
        .closest(".sidebar-sub-item")
        ?.classList.contains("active");
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = link.href;
      a.className =
        "sidebar-collapsed-popover-link" + (isActive ? " active" : "");
      a.textContent = link.textContent;
      li.appendChild(a);
      ul.appendChild(li);
    });

    popover.appendChild(ul);
    document.body.appendChild(popover);

    const sidebar = document.getElementById("sidebar");
    const sidebarRect = sidebar.getBoundingClientRect();
    const itemRect = railItem.getBoundingClientRect();

    // As a navbar the list drops under its section's pill.
    if (this._navbar()) {
      popover.style.left =
        Math.min(itemRect.left, innerWidth - popover.offsetWidth - 8) + "px";
      popover.style.top = itemRect.bottom + 8 + "px";
      return;
    }

    popover.style.left = sidebarRect.right + 4 + "px";

    const top = Math.min(
      itemRect.top,
      window.innerHeight - popover.offsetHeight - 8,
    );
    popover.style.top = Math.max(8, top) + "px";
  },

  _hideCollapsedPopover() {
    clearTimeout(this._popoverTimer);
    const el = document.getElementById("sidebar-collapsed-popover");
    if (el) el.remove();
  },

  /* ── Rail: pick the section the panel shows ── */

  _initAccordion() {
    document.addEventListener("click", (e) => {
      if (!e.target.closest("#sidebar-collapsed-popover"))
        this._hideCollapsedPopover();
      const rail = e.target.closest(".sidebar-rail-item");
      if (!rail) return;
      const sidebar = document.getElementById("sidebar");
      // Collapsed on desktop there is no panel: the button navigates.
      if (
        !this._mobileQuery.matches &&
        sidebar?.getAttribute("data-collapsed") === "true"
      )
        return;
      const section = rail.getAttribute("data-section");
      // A section without pages has nothing to list: navigate to it.
      if (
        !document.querySelector(
          `.sidebar-accordion-item[data-section="${section}"]`,
        )
      )
        return;
      e.preventDefault();
      // A navbar section lists its pages on click too (touch has no hover).
      if (this._navbar()) return this._showCollapsedPopover(rail);
      sidebar
        .querySelectorAll(".is-shown")
        .forEach((el) => el.classList.remove("is-shown"));
      sidebar
        .querySelectorAll(`[data-section="${section}"]`)
        .forEach((el) => el.classList.add("is-shown"));
      document.getElementById("sidebar-nav").scrollTop = 0;
    });
  },

  /* ── Mobile drawer ── */

  initMobileDrawer() {
    const hamburger = document.getElementById("sidebar-hamburger");
    const overlay = document.getElementById("sidebar-overlay");

    if (hamburger) {
      hamburger.addEventListener("click", () => this.openDrawer());
    }
    if (overlay) {
      overlay.addEventListener("click", () => this.closeDrawer());
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.closeDrawer();
    });
  },

  openDrawer() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    if (!sidebar) return;
    sidebar.setAttribute("data-drawer-open", "true");
    overlay?.classList.add("active");
    document.body.style.overflow = "hidden";
  },

  closeDrawer() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    if (!sidebar) return;
    sidebar.setAttribute("data-drawer-open", "false");
    overlay?.classList.remove("active");
    document.body.style.overflow = "";
  },
});
