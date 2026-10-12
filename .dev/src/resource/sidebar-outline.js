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
  },

  /* ── Theme ── */

  initTheme() {
    const saved = localStorage.getItem(THEME_KEY) || "device";
    this.applyTheme(saved);
  },

  applyTheme(theme) {
    const isDark =
      theme === "dark" ||
      (theme === "device" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.setAttribute("data-darkmode", isDark);
    localStorage.setItem(THEME_KEY, theme);
    this._updateThemeIcon(isDark);
  },

  _updateThemeIcon(isDark) {
    const btn = document.getElementById("theme-toggle-btn");
    if (!btn) return;
    const img = btn.querySelector("img");
    if (!img) return;
    const media =
      document.documentElement.getAttribute("data-outline-media") ||
      "/luci-static/outline";
    const base = String(media).replace(/\/$/, "");
    img.src = base + (isDark ? "/icons/moon.svg" : "/icons/sun.svg");
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
      .addEventListener("change", () => {
        if ((localStorage.getItem(THEME_KEY) || "device") === "device") {
          this.applyTheme("device");
        }
      });
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

    const collapsed = localStorage.getItem(SIDEBAR_KEY) === "true";
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

  _initCollapsedPopover() {
    document.addEventListener("mouseover", (e) => {
      const sidebar = document.getElementById("sidebar");
      if (sidebar?.getAttribute("data-collapsed") !== "true") return;

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
      const sidebar = document.getElementById("sidebar");
      if (sidebar?.getAttribute("data-collapsed") !== "true") return;

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
