"use strict";
"require view";
"require rpc";
"require uci";
"require ui";
"require outline.icons as icons";
"require outline.ui as w";

/*
 * System › Outline Theme › Branding -- two choices, picked like Codex's dock icon:
 *
 *   Logo      the sidebar and sign-in logo: the theme's cat, OpenWrt's logo
 *             (luci-theme-bootstrap's, referenced in place -- value `openwrt`),
 *             an upload, or a new upload.
 *   App icon  one picture for the browser tab, the home screen and the
 *             installed web app: the theme's icons, the logo, OpenWrt's logo,
 *             an upload. On Save the page renders every size from it
 *             (outline/icons.js) and uploads them into the five icon
 *             slots header.ut serves: favicon, favicon_ico, apple_touch,
 *             pwa_192, pwa_512.
 *
 * Uploads are files at once (cgi-upload to a fixed tmp path, then rpcd checks
 * type, size and content and stores <slot>-<time>.<ext> under
 * /www/luci-static/outline-brand). Which picture is used is a setting: it
 * previews on this page only and is stored by the footer's Save / Save &
 * Apply like any LuCI form.
 */

const callState = rpc.declare({ object: "luci.outline", method: "get_state" });
const callBrandList = rpc.declare({
  object: "luci.outline",
  method: "brand_list",
});
const callBrandUpload = rpc.declare({
  object: "luci.outline",
  method: "brand_upload",
  params: ["slot", "name"],
});

const BRAND_URL = "/luci-static/outline-brand/";
const UPLOAD_TMP = "/tmp/outline-brand.upload";
const PICTURE = ["svg", "png", "jpg", "jpeg", "webp"];
/* The slots generated from the App icon, as header.ut reads them. */
const ICON_SLOTS = [
  "favicon",
  "favicon_ico",
  "apple_touch",
  "pwa_192",
  "pwa_512",
];

function media() {
  return (
    document.documentElement.getAttribute("data-outline-media") ||
    "/luci-static/outline"
  );
}

function themeImage(name) {
  return media() + "/images/" + name;
}

function extOf(name) {
  const m = /\.([A-Za-z0-9]+)$/.exec(name || "");
  return m ? m[1].toLowerCase() : "";
}

function formatSize(bytes) {
  return bytes >= 1048576
    ? (bytes / 1048576).toFixed(1) + " MB"
    : Math.max(1, Math.round(bytes / 1024)) + " KB";
}

function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

return view.extend({
  load() {
    return Promise.all([
      L.resolveDefault(callState(), null),
      L.resolveDefault(callBrandList(), null),
      uci.load("outline").catch(() => null),
    ]);
  },

  render(data) {
    this.data = data[0] || {};
    this.lib = data[1] || { assets: [], max: 4194304, rev: "0" };
    const b = uci.get("outline", "branding") || {};
    this.state = { logo: b.logo || "", icon: b.icon || "" };
    this.saved = clone(this.state);
    this.busy = {};
    this.root = E("div", { class: "ot" });
    this.input = E("input", {
      type: "file",
      hidden: "",
      accept: PICTURE.map((t) => "." + t).join(","),
      change: (ev) => {
        const file = ev.target.files && ev.target.files[0];
        ev.target.value = "";
        if (file && this.pending) this.upload(this.pending, file);
      },
    });
    this.captureOriginal();

    const mo = new MutationObserver(() => {
      if (!this.root.isConnected) {
        mo.disconnect();
        this.restoreOriginal();
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    this.paint();
    return E("div", {}, [w.styleNode(), this.root, this.input]);
  },

  /* ── Sources ── */

  assetUrl(name) {
    return (
      BRAND_URL +
      encodeURIComponent(name) +
      "?v=" +
      encodeURIComponent(this.lib.rev || "0")
    );
  },

  has(name) {
    return !!name && this.lib.assets.some((a) => a.name == name);
  },

  openwrtUrl() {
    return (this.lib.builtin && this.lib.builtin.openwrt) || null;
  },

  /* The logo the state picks, or null for the theme's cat. */
  logoUrl(state) {
    const v = (state || this.state).logo;
    if (v == "openwrt") return this.openwrtUrl();
    return this.has(v) ? this.assetUrl(v) : null;
  },

  /* The App icon source picture, or null for the theme's own icons. */
  iconUrl(state) {
    state = state || this.state;
    const v = state.icon;
    if (v == "logo") return this.logoUrl(state);
    if (v == "openwrt") return this.openwrtUrl();
    return this.has(v) ? this.assetUrl(v) : null;
  },

  /* What the App icon resolves to, for "has it changed since Save?". */
  iconKey(state) {
    const v = state.icon;
    if (v == "logo") return this.logoUrl(state) ? "logo:" + state.logo : "";
    return this.iconUrl(state) ? v : "";
  },

  uploadsFor(slot) {
    const prefix = slot + "-";
    return this.lib.assets.filter(
      (a) => a.name.indexOf(prefix) == 0 && PICTURE.indexOf(a.type) > -1,
    );
  },

  /* ── Preview, only while this page is shown ── */

  targets() {
    const q = (sel) =>
      Array.prototype.slice.call(document.querySelectorAll(sel));
    return {
      logo: q("img.sidebar-logo"),
      favicon: q('link[rel="icon"]'),
      apple: q('link[rel="apple-touch-icon"]'),
    };
  },

  captureOriginal() {
    this.original = [];
    const t = this.targets();
    for (const k in t)
      t[k].forEach((el) => {
        const attr = el.tagName == "IMG" ? "src" : "href";
        this.original.push([
          el,
          attr,
          el.getAttribute(attr),
          el.getAttribute("type"),
        ]);
      });
    const sb = document.getElementById("sidebar");
    if (sb)
      this.original.push([sb, "data-logo", sb.getAttribute("data-logo"), null]);
  },

  restoreOriginal() {
    (this.original || []).forEach((e) => {
      if (e[2] == null) e[0].removeAttribute(e[1]);
      else e[0].setAttribute(e[1], e[2]);
      if (e[0].tagName == "LINK") {
        if (e[3] == null) e[0].removeAttribute("type");
        else e[0].setAttribute("type", e[3]);
      }
    });
    w.closePopover();
  },

  /* Sidebar logo and the tab icon follow the page state; untouched ones
	   go back to what the page loaded with. */
  preview() {
    this.restoreOriginal();
    const t = this.targets();
    const logo = this.logoUrl();
    if (logo) {
      t.logo.forEach((el) => el.setAttribute("src", logo));
      const sb = document.getElementById("sidebar");
      if (sb) sb.setAttribute("data-logo", logo);
    }
    if (this.iconKey(this.state) != this.iconKey(this.saved)) {
      const icon = this.iconUrl() || themeImage("favicon.svg");
      t.favicon.concat(t.apple).forEach((el) => {
        el.setAttribute("href", icon);
        el.removeAttribute("type");
      });
    }
  },

  set(field, value) {
    this.state[field] = value;
    this.preview();
    this.paint();
  },

  /* ── Uploads ── */

  /* One file into one slot; resolves to its library name. */
  send(slot, file) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.addEventListener("load", () =>
        xhr.status == 200
          ? resolve()
          : reject(new Error(_("Upload failed (HTTP %s)").format(xhr.status))),
      );
      xhr.addEventListener("error", () =>
        reject(new Error(_("Upload failed"))),
      );
      const fd = new FormData();
      fd.append("sessionid", rpc.getSessionID());
      fd.append("filename", UPLOAD_TMP);
      fd.append("filemode", "0600");
      fd.append("filedata", file, file.name);
      xhr.open("POST", L.env.cgi_base + "/cgi-upload");
      xhr.send(fd);
    })
      .then(() => callBrandUpload(slot, file.name))
      .then((res) => {
        if (!res || res.error)
          throw new Error(
            res && res.error ? res.error : _("no answer from the router"),
          );
        this.lib = res.state;
        return res.state.name;
      });
  },

  pick(field) {
    this.pending = field;
    this.input.click();
  },

  upload(field, file) {
    const ext = extOf(file.name),
      max = this.lib.max || 4194304;
    if (PICTURE.indexOf(ext) < 0) {
      w.toast(_("Use an SVG, PNG, JPG or WebP picture."), "warning");
      return;
    }
    if (file.size > max) {
      w.toast(
        _("%s is %s; the limit is %s.").format(
          file.name,
          formatSize(file.size),
          formatSize(max),
        ),
        "warning",
      );
      return;
    }
    this.busy[field] = true;
    this.paint();
    return this.send(field, file)
      .then((name) => {
        this.state[field] = name;
      })
      .catch((err) => {
        w.toast(
          _("Could not upload %s: %s").format(file.name, err.message || err),
          "danger",
        );
      })
      .then(() => {
        delete this.busy[field];
        this.preview();
        this.paint();
      });
  },

  /* ── Footer: Save / Save & Apply / Reset ── */

  /* Render and upload the five icon sizes when the App icon changed (or
	   they are missing); resolves to { slot: name } or null for the theme's
	   own icons. */
  iconFiles() {
    const url = this.iconUrl();
    if (!url) return Promise.resolve(null);
    const b = uci.get("outline", "branding") || {};
    if (
      this.iconKey(this.state) == this.iconKey(this.saved) &&
      ICON_SLOTS.every((s) => this.has(b[s]))
    ) {
      const keep = {};
      ICON_SLOTS.forEach((s) => (keep[s] = b[s]));
      return Promise.resolve(keep);
    }
    w.toast(_("Generating the icons…"));
    return icons.generate(url).then((files) => {
      const out = {};
      return ICON_SLOTS.reduce(
        (p, slot) =>
          p.then(() =>
            this.send(slot, files[slot]).then((n) => {
              out[slot] = n;
            }),
          ),
        Promise.resolve(),
      ).then(() => out);
    });
  },

  handleSave() {
    return this.iconFiles()
      .then((files) => {
        if (!uci.get("outline", "branding"))
          uci.add("outline", "branding", "branding");
        const put = (opt, val) =>
          val
            ? uci.set("outline", "branding", opt, val)
            : uci.unset("outline", "branding", opt);

        put("logo", this.logoUrl() ? this.state.logo : "");
        put("icon", this.iconUrl() ? this.state.icon : "");
        ICON_SLOTS.forEach((s) => put(s, files ? files[s] : ""));
        /* Options earlier builds wrote and nothing reads any more. */
        uci.unset("outline", "branding", "app_name");
        uci.unset("outline", "branding", "manifest");

        return uci.save();
      })
      .then(() => {
        this.saved = clone(this.state);
        if (ui.changes && ui.changes.init) ui.changes.init();
        this.paint();
      })
      .catch((err) => {
        ui.addNotification(
          null,
          E(
            "p",
            {},
            _("Unable to save the branding settings: %s").format(
              err.message || err,
            ),
          ),
          "danger",
        );
        return Promise.reject(err);
      });
  },

  handleReset() {
    this.state = clone(this.saved);
    this.preview();
    this.paint();
  },

  /* ── Render ── */

  tile(opts) {
    return E(
      "button",
      {
        type: "button",
        class: "ot-pick" + (opts.add ? " add" : ""),
        role: opts.add ? null : "radio",
        "aria-checked": opts.add ? null : opts.checked ? "true" : "false",
        title: opts.title || opts.label,
        disabled: opts.disabled ? "" : null,
        click: opts.onClick,
      },
      [
        E("span", { class: "ot-pick-face" }, [
          opts.src
            ? E("img", { src: opts.src, alt: "", decoding: "async" })
            : w.icon(opts.icon),
          opts.add
            ? ""
            : E(
                "span",
                { class: "ot-pick-check", "aria-hidden": "true" },
                w.icon("check"),
              ),
        ]),
        E("span", { class: "ot-pick-name" }, opts.label),
      ],
    );
  },

  uploadTiles(field, current) {
    const out = [];
    const own = this.uploadsFor(field);
    if (this.has(current) && !own.some((a) => a.name == current))
      own.unshift(this.lib.assets.find((a) => a.name == current));
    own.slice(0, 2).forEach((a, i) => {
      const meta = [a.type.toUpperCase(), formatSize(a.size)];
      if (a.width && a.height) meta.push(a.width + "×" + a.height);
      out.push(
        this.tile({
          label: i == 0 ? _("Custom") : _("Earlier"),
          title: meta.join(" · "),
          src: this.assetUrl(a.name),
          checked: current == a.name,
          onClick: () => this.set(field, a.name),
        }),
      );
    });
    out.push(
      this.tile({
        add: true,
        icon: this.busy[field] ? "refresh" : "plus",
        label: this.busy[field] ? _("Uploading…") : _("Upload"),
        title: _("Upload an SVG, PNG, JPG or WebP picture"),
        disabled: this.busy[field],
        onClick: () => this.pick(field),
      }),
    );
    return out;
  },

  pickerRow(label, desc, tiles) {
    const row = w.row({
      label: label,
      description: desc,
      /* Compact tiles: the same scale as the page's pills and chips. */
      control: E(
        "div",
        { class: "ot-picks sm", role: "radiogroup", "aria-label": label },
        tiles,
      ),
    });
    row.classList.add("picker");
    return row;
  },

  logoRow() {
    const v = this.logoUrl() ? this.state.logo : "";
    const tiles = [
      this.tile({
        label: "Outline",
        title: _("Outline (theme default)"),
        src: themeImage("logo.png"),
        checked: v == "",
        onClick: () => this.set("logo", ""),
      }),
    ];
    if (this.openwrtUrl())
      tiles.push(
        this.tile({
          label: "OpenWrt",
          src: this.openwrtUrl(),
          checked: v == "openwrt",
          onClick: () => this.set("logo", "openwrt"),
        }),
      );
    return this.pickerRow(
      _("Logo"),
      _("Sidebar and sign-in page"),
      tiles.concat(this.uploadTiles("logo", v)),
    );
  },

  iconRow() {
    const v = this.iconUrl() ? this.state.icon : "";
    const tiles = [
      this.tile({
        label: _("Default"),
        title: _("The theme's icons"),
        src: themeImage("apple-touch-icon.png"),
        checked: v == "",
        onClick: () => this.set("icon", ""),
      }),
    ];
    /* "Same as the logo" only means something once the logo is not the
		   theme's -- the default icons already are the cat. */
    if (this.logoUrl())
      tiles.push(
        this.tile({
          label: _("Logo"),
          title: _("Same as the logo"),
          src: this.logoUrl(),
          checked: v == "logo",
          onClick: () => this.set("icon", "logo"),
        }),
      );
    if (this.openwrtUrl())
      tiles.push(
        this.tile({
          label: "OpenWrt",
          src: this.openwrtUrl(),
          checked: v == "openwrt",
          onClick: () => this.set("icon", "openwrt"),
        }),
      );
    return this.pickerRow(
      _("App icon"),
      _("Tab, home screen and app · every size is made from one picture"),
      tiles.concat(this.uploadTiles("icon", v)),
    );
  },

  paint() {
    w.closePopover();
    this.root.replaceChildren(
      E("h2", { name: "content", class: "ot-head" }, _("Branding")),
      E("div", { class: "ot-sections" }, [
        w.section(_("Brand"), null, [w.card([this.logoRow(), this.iconRow()])]),
      ]),
    );
  },
});
