"use strict";
"require baseclass";
"require ui";

/*
 * Settings widgets in the Codex style: section, card, row, pill menus with a
 * flyout submenu, colour chips with an HSV popover, toggle, segmented
 * control, size field, contrast slider and the Mode thumbnails.
 *
 * Plain E() DOM. Colours come from the theme's tokens with Bootstrap-safe
 * fallbacks, so the page stays usable on a router that does not run Outline
 * yet (it is also where Outline gets installed from). The stylesheet is
 * mounted inside the view, never in <head>: an unmarked <head> style would
 * make the theme's router fall back to a full load on the next navigation.
 */

const CSS = `
.ot,.ot-pop{--ot-panel:var(--panel-bg,var(--background-color-high,#fff));--ot-surface:var(--surface,var(--background-color-high,transparent));--ot-line:var(--border,var(--border-color-medium,rgba(0,0,0,.1)));--ot-line-strong:var(--input,var(--border-color-high,rgba(0,0,0,.15)));--ot-text:var(--text,var(--text-color-highest,#0d0d0d));--ot-muted:var(--muted-foreground,var(--text-color-medium,#5d5d5d));--ot-faint:var(--text-tertiary,var(--text-color-medium,#8f8f8f));--ot-hover:var(--hover,var(--background-color-low,rgba(0,0,0,.05)));--ot-soft:var(--soft-hover,var(--border-color-medium,rgba(0,0,0,.1)));--ot-fill:var(--select-bg,var(--background-color-medium,#f3f3f3));--ot-pop:var(--elevated,var(--background-color-high,#fff));--ot-ring:var(--ring,var(--primary-color-medium,#3a83f7));--ot-accent:var(--accent,var(--primary-color-medium,#3a83f7));--ot-link:var(--link,var(--primary-color-high,#2c67c5));--ot-primary:var(--primary,var(--text-color-highest,#0d0d0d));--ot-on-primary:var(--primary-foreground,var(--background-color-high,#fff));--ot-primary-hover:var(--primary-hover,var(--text-color-high,#303030));--ot-switch-off:var(--switch-off,var(--border-color-high,rgba(13,13,13,.15)));--ot-danger:var(--danger-surface-fg,var(--error-color-high,#ba2623));--ot-danger-soft:var(--danger-soft,rgba(224,46,42,.1));--ot-danger-soft-hover:var(--destructive-a20,rgba(224,46,42,.2));--ot-danger-text:var(--destructive,var(--error-color-high,#e02e2a));--ot-btn:var(--muted,var(--background-color-low,rgba(0,0,0,.05)));--ot-btn-hover:var(--soft-hover,var(--border-color-medium,rgba(0,0,0,.1)));--ot-danger-solid:var(--danger-solid,var(--error-color-high,#e02e2a));--ot-info-bg:var(--info-surface,var(--background-color-medium,#e8f3fe));--ot-info-fg:var(--info-surface-fg,var(--text-color-highest,#004f99));--ot-warn-bg:var(--warning-surface,var(--background-color-medium,#fff5f0));--ot-warn-fg:var(--warning-surface-fg,var(--warn-color-high,#b9480d));--ot-ok-bg:var(--success-surface,var(--background-color-medium,#edfaf2));--ot-ok-fg:var(--success-surface-fg,var(--success-color-high,#008635));--ot-shadow:var(--shadow-menu,0 8px 24px rgba(0,0,0,.2),0 0 0 1px rgba(127,127,127,.15));color:var(--ot-text)}
.ot *,.ot-pop *{box-sizing:border-box}
.modal .ot{text-align:left}
.modal .ot .ot-log{width:100%}
.ot-head{margin-bottom:32px}
.ot-sections{display:flex;flex-direction:column;gap:40px}
.ot-section{display:flex;flex-direction:column}
.ot-section-head{display:flex;justify-content:space-between;align-items:center;min-height:36px;padding-bottom:6px;gap:12px}
.ot-section-title{font-size:var(--text-sm,14px);font-weight:500;color:var(--ot-text);margin:0}
.ot-stack{display:flex;flex-direction:column;gap:16px}
.ot-pair{display:flex;flex-direction:column;gap:20px}
.ot-card{position:relative;display:flex;flex-direction:column;border:1px solid var(--ot-line);border-radius:16px;background:var(--ot-panel);overflow:visible}
.ot-card>.ot-row{position:relative}
.ot-card>.ot-row:not(:last-child)::after{content:"";position:absolute;left:16px;right:16px;bottom:0;height:1px;background:var(--ot-line)}
.ot-row{display:flex;justify-content:space-between;align-items:center;gap:24px;padding:12px 16px;min-height:52px}
.ot-row.compact{gap:16px;padding:8px 16px;min-height:44px}
.ot-row.nested{gap:12px;padding:8px 16px;min-height:40px}
.ot-row.nested .ot-label{font-weight:500}
.ot-row.tall{min-height:76px}
.ot-label-block{display:flex;flex-direction:column;gap:2px;min-width:0}
.ot-label{font-size:var(--text-sm,14px);line-height:20px;font-weight:500;color:var(--ot-text)}
.ot-desc{font-size:var(--text-xs,12px);line-height:16px;color:var(--ot-muted)}
.ot-control{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-shrink:0;min-width:min(160px,40%)}
@media (max-width:640px){.ot-row.nested{flex-direction:column;align-items:stretch}.ot-row.nested .ot-control{justify-content:flex-start}}
.ot-btn{display:inline-flex;align-items:center;justify-content:center;gap:4px;box-sizing:border-box;height:32px;min-height:0;margin:0;padding:0 12px;border:1px solid transparent;border-radius:9999px;background:var(--ot-btn);box-shadow:none;color:var(--ot-text);font:inherit;font-size:var(--text-sm,14px);font-weight:400;line-height:18px;cursor:pointer;white-space:nowrap;user-select:none;transition:background-color .15s,opacity .15s}
.ot-btn:hover{background:var(--ot-btn-hover)}
.ot-btn:focus-visible{outline:0;box-shadow:0 0 0 2px var(--ot-ring)}
.ot-btn:disabled{opacity:.4;cursor:default;background:var(--ot-btn)}
.ot-btn.primary{background:var(--ot-primary);color:var(--ot-on-primary)}
.ot-btn.primary:hover,.ot-btn.primary:disabled{background:var(--ot-primary-hover)}
.ot-btn.primary:disabled{background:var(--ot-primary)}
.ot-btn.danger{background:var(--ot-danger-soft);color:var(--ot-danger-text)}
.ot-btn.danger:hover{background:var(--ot-danger-soft-hover)}
.ot-btn.solid-danger{background:var(--ot-danger-solid);color:#fff}
.ot-btn .ot-icon{width:16px;height:16px}
.ot-dialog-actions .ot-btn{height:36px;padding:0 12px;font-weight:500}
.ot-link{display:inline-flex;align-items:center;gap:4px;padding:0;border:0;background:none;font:inherit;font-size:var(--text-sm,14px);color:var(--ot-faint);cursor:pointer;border-radius:6px}
.ot-link:hover{color:var(--ot-text)}
.ot-link.big{font-size:var(--text-base,16px)}
.ot-link:disabled{opacity:.5;cursor:default}
.ot-icon{display:inline-flex;width:16px;height:16px;flex-shrink:0}
.ot-icon svg{width:100%;height:100%}
.ot-iconbtn{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:9999px;border:0;background:transparent;color:var(--ot-faint);cursor:pointer;padding:0}
.ot-iconbtn .ot-icon{width:18px;height:18px}
.ot-iconbtn:hover{background:var(--ot-hover);color:var(--ot-text)}
.ot-pill{display:inline-flex;align-items:center;gap:4px;height:28px;padding:0 8px;width:100%;max-width:144px;border:1px solid var(--ot-line);border-radius:9999px;background:var(--ot-surface);color:var(--ot-text);font:inherit;font-size:var(--text-xs,12px);line-height:16px;cursor:pointer;text-align:left}
.ot-pill:hover,.ot-pill[aria-expanded="true"]{background:var(--ot-hover)}
.ot-pill:disabled{opacity:.5;cursor:default;background:transparent}
.ot-pill.auto{width:auto}
.ot-pill.wide{width:176px;max-width:176px;padding:0 12px 0 4px;font-size:var(--text-sm,14px)}
.ot-pill-main{display:flex;flex:1;min-width:0;align-items:center;gap:6px}
.ot-pill-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ot-pill .ot-chev{width:14px;height:14px;color:var(--ot-faint);margin-left:auto}
.ot-dot{display:inline-block;width:12px;height:12px;border-radius:9999px;border:1px solid var(--ot-line);flex-shrink:0}
.ot-aa{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:9999px;border:1px solid;font-size:12px;line-height:1;font-weight:600;flex-shrink:0;font-family:var(--font-sans,inherit)}
.ot-aa.sm{width:20px;height:20px;font-size:11px}
.ot-chip{position:relative;display:flex;align-items:center;gap:8px;height:28px;width:96px;padding:0 8px;border:1px solid var(--ot-line);border-radius:9999px;color:var(--ot-text)}
.ot-chip:focus-within{box-shadow:0 0 0 2px var(--ot-ring)}
.ot-chip button{width:14px;height:14px;padding:0;border-radius:9999px;border:1px solid var(--ot-line);cursor:pointer;flex-shrink:0}
.ot-chip input{flex:1;min-width:0;width:100%;height:auto;min-height:0;padding:0;margin:0;border:0!important;background:transparent!important;box-shadow:none!important;outline:0;color:inherit;font:inherit;font-size:var(--text-xs,12px);text-transform:uppercase;font-variant-numeric:tabular-nums}
.ot-toggle{position:relative;display:inline-flex;align-items:center;width:32px;height:20px;padding:0;border:0;border-radius:9999px;background:var(--ot-switch-off);cursor:pointer;transition:background-color .15s cubic-bezier(0,0,.2,1);flex-shrink:0}
.ot-toggle[aria-checked="true"]{background:var(--ot-accent)}
.ot-toggle::after{content:"";position:absolute;left:2px;top:2px;width:16px;height:16px;border-radius:9999px;background:#fff;border:1px solid rgba(0,0,0,.04);box-shadow:0 1px 2px rgba(0,0,0,.15);transition:transform .15s cubic-bezier(0,0,.2,1)}
.ot-toggle[aria-checked="true"]::after{transform:translateX(12px)}
.ot-toggle:disabled{opacity:.5;cursor:default}
.ot-seg{display:inline-flex;gap:2px;padding:2px;border-radius:9999px;background:var(--ot-fill)}
.ot-seg button{box-sizing:border-box;height:24px;min-height:0;margin:0;padding:2px 8px;border:1px solid transparent;border-radius:9999px;background:transparent;color:var(--ot-faint);font:inherit;font-size:var(--text-sm,14px);line-height:18px;cursor:pointer}
.ot-seg button:hover{background:var(--ot-hover)}
.ot-seg button[aria-pressed="true"]{color:var(--ot-text);background:var(--ot-soft)}
.ot-num{display:flex;align-items:center;gap:8px}
.ot-num input{width:64px;height:28px;min-height:0;padding:0 8px;margin:0;border:1px solid var(--ot-line-strong);border-radius:8px;background:var(--ot-fill);color:var(--ot-text);font:inherit;font-size:var(--text-sm,14px);font-variant-numeric:tabular-nums;box-shadow:none}
.ot-num input:focus{outline:0;border-color:var(--ot-ring)}
.ot-num span{font-size:var(--text-sm,14px);color:var(--ot-muted)}
.ot-slider{display:flex;align-items:center;gap:10px;height:36px;min-width:12rem}
.ot-slider input{-webkit-appearance:none;appearance:none;flex:1;height:2px;min-height:0;margin:0;padding:0;border:0;border-radius:9999px;background:var(--ot-line);color:var(--ot-text);cursor:pointer;box-shadow:none}
.ot-slider input::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:9999px;background:currentColor;border:0;box-shadow:0 1px 2px rgba(0,0,0,.2)}
.ot-slider input::-moz-range-thumb{width:20px;height:20px;border-radius:9999px;background:currentColor;border:0;box-shadow:0 1px 2px rgba(0,0,0,.2)}
.ot-slider output{width:36px;text-align:right;font-size:var(--text-sm,14px);font-variant-numeric:tabular-nums}
.ot-modes{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;width:272px}
.ot-modes.two{grid-template-columns:repeat(2,1fr);width:176px}
.ot-mode{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer}
.ot-mode input{position:absolute;opacity:0;pointer-events:none}
.ot-tile{position:relative;isolation:isolate;display:block;width:100%;aspect-ratio:4/3;overflow:hidden;border-radius:8px;color:var(--ot-link)}
.ot-tile svg{display:block;width:100%;height:100%}
.ot-tile.split{display:grid;grid-template-columns:1fr 1fr}
.ot-tile::after{content:"";position:absolute;inset:0;border-radius:8px;border:2px solid var(--ot-line);pointer-events:none}
.ot-mode:hover .ot-tile::after{border-color:var(--ot-line-strong)}
.ot-mode input:checked+.ot-tile::after{border-color:var(--ot-ring)}
.ot-mode input:focus-visible+.ot-tile{outline:2px solid var(--ot-ring);outline-offset:2px}
.ot-banner{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 16px;border:1px solid var(--ot-line);border-radius:16px;background:var(--ot-info-bg);color:var(--ot-info-fg);font-size:var(--text-sm,14px);margin-bottom:24px}
.ot-banner.warn{background:var(--ot-warn-bg);color:var(--ot-warn-fg)}
.ot-mono{font-family:var(--font-mono,monospace);font-size:var(--text-xs,12px)}
.ot-badge{display:inline-flex;align-items:center;height:20px;padding:0 8px;border-radius:9999px;background:var(--ot-fill);color:var(--ot-muted);font-size:var(--text-xs,12px);font-weight:500}
.ot-badge.ok{background:var(--ot-ok-bg);color:var(--ot-ok-fg)}
.ot-badge.new{background:var(--ot-info-bg);color:var(--ot-info-fg)}
.ot-log{max-height:220px;overflow:auto;margin:12px 0 0;padding:10px 12px;border-radius:12px;background:var(--ot-fill);font-family:var(--font-mono,monospace);font-size:12px;line-height:18px;white-space:pre-wrap;word-break:break-word}
.ot-dialog-input{width:100%;height:36px;padding:0 10px;border:1px solid var(--ot-line-strong);border-radius:8px;background:var(--ot-fill);color:var(--ot-text);font-family:var(--font-mono,monospace);font-size:12px}
.ot-dialog-input:focus{outline:0;border-color:var(--ot-ring)}
.ot-dialog-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}
.ot-drop{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;margin:12px 16px;padding:20px 16px;border:1px dashed var(--ot-line-strong);border-radius:12px;color:var(--ot-muted);font-size:var(--text-sm,14px);text-align:center;cursor:pointer;transition:background-color .15s,border-color .15s}
.ot-drop:hover,.ot-drop.over{border-color:var(--ot-ring);background:var(--ot-hover)}
.ot-drop .ot-icon{width:20px;height:20px;color:var(--ot-faint)}
.ot-drop b{color:var(--ot-text);font-weight:500}
.ot-asset{display:flex;align-items:center;gap:12px;min-width:0}
.ot-thumb{flex-shrink:0;width:40px;height:40px;border-radius:8px;border:1px solid var(--ot-line);object-fit:contain;padding:4px;background:repeating-conic-gradient(var(--ot-fill) 0 25%,transparent 0 50%) 0 0/12px 12px}
.ot-thumb.sm{width:20px;height:20px;padding:1px;border-radius:5px}
.ot-thumb.slot{width:28px;height:28px;padding:2px;border-radius:6px}
.ot-asset .ot-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ot-bar{width:100%;height:4px;margin-top:6px;border-radius:9999px;background:var(--ot-line);overflow:hidden}
.ot-bar>i{display:block;height:100%;width:0;border-radius:9999px;background:var(--ot-accent);transition:width .15s}
.ot-text{width:200px;height:28px;min-height:0;margin:0;padding:0 10px;border:1px solid var(--ot-line-strong);border-radius:8px;background:var(--ot-fill);color:var(--ot-text);font:inherit;font-size:var(--text-sm,14px);box-shadow:none}
.ot-text:focus{outline:0;border-color:var(--ot-ring)}
.ot-row.picker{flex-wrap:wrap}
.ot-picks{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:12px}
.ot-pick{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;width:72px;height:auto;min-height:0;margin:0;padding:0;border:0;border-radius:0;background:none;box-shadow:none;color:var(--ot-muted);font:inherit;font-size:var(--text-xs,12px);line-height:16px;cursor:pointer}
.ot-pick:hover{background:none}
.ot-pick-face{position:relative;flex-shrink:0;box-sizing:border-box;display:flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:18px;background:var(--ot-fill);box-shadow:inset 0 0 0 1px var(--ot-line);transition:transform .15s cubic-bezier(0,0,.2,1),box-shadow .15s}
.ot-pick-face img{display:block;width:44px;height:44px;max-width:none;object-fit:contain;border-radius:10px;pointer-events:none}
.ot-pick:hover .ot-pick-face{transform:translateY(-2px);box-shadow:inset 0 0 0 1px var(--ot-line-strong),0 6px 16px rgba(0,0,0,.18)}
.ot-pick:active .ot-pick-face{transform:translateY(0) scale(.97)}
.ot-pick[aria-checked="true"]{color:var(--ot-text)}
.ot-pick[aria-checked="true"] .ot-pick-face{box-shadow:inset 0 0 0 2px var(--ot-ring),0 0 0 4px var(--ot-hover)}
.ot-pick-check{position:absolute;top:-6px;right:-6px;display:none;align-items:center;justify-content:center;width:20px;height:20px;border-radius:9999px;background:var(--ot-accent);color:var(--on-accent,#fff);box-shadow:0 0 0 2px var(--ot-panel)}
.ot-pick-check .ot-icon{width:12px;height:12px}
.ot-pick[aria-checked="true"] .ot-pick-check{display:flex}
.ot-pick:focus-visible{outline:0}
.ot-pick:focus-visible .ot-pick-face{box-shadow:inset 0 0 0 2px var(--ot-ring),0 0 0 4px var(--ot-hover)}
.ot-pick.add .ot-pick-face{background:transparent;box-shadow:none;border:1.5px dashed var(--ot-line-strong)}
.ot-pick.add .ot-pick-face .ot-icon{width:22px;height:22px;color:var(--ot-faint)}
.ot-pick.add:hover .ot-pick-face{border-color:var(--ot-ring);box-shadow:none}
.ot-pick.add:hover .ot-icon{color:var(--ot-text)}
.ot-pick-name{display:block;max-width:72px;height:16px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ot-picks.sm{gap:10px}
.ot-picks.sm .ot-pick{width:52px;gap:4px;font-size:11px;line-height:14px}
.ot-picks.sm .ot-pick-face{width:44px;height:44px;border-radius:12px}
.ot-picks.sm .ot-pick-face img{width:28px;height:28px;border-radius:6px}
.ot-picks.sm .ot-pick-name{max-width:52px;height:14px}
.ot-picks.sm .ot-pick-check{width:16px;height:16px;top:-5px;right:-5px}
.ot-picks.sm .ot-pick-check .ot-icon{width:10px;height:10px}
.ot-picks.sm .ot-pick.add .ot-pick-face .ot-icon{width:18px;height:18px}
.ot-pop{position:fixed;z-index:10000;min-width:160px;padding:4px;border-radius:14px;background:var(--ot-pop);color:var(--ot-text);box-shadow:var(--ot-shadow);border:1px solid var(--ot-line);font-size:var(--text-sm,14px)}
.ot-pop.wide{width:240px}
.ot-pop.narrow{width:208px}
.ot-pop.picker{padding:12px;border-radius:12px;min-width:0}
.ot-menu-scroll{max-height:320px;overflow-y:auto}
.ot-mi{display:flex;align-items:center;gap:8px;width:100%;min-height:32px;padding:6px 8px;border:0;border-radius:8px;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}
.ot-mi:hover,.ot-mi:focus-visible,.ot-mi[aria-expanded="true"]{background:var(--ot-hover);outline:0}
.ot-mi .ot-mi-text{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ot-mi .ot-icon{color:var(--ot-faint)}
.ot-mi .ot-check{color:var(--ot-text)}
.ot-sep{height:1px;margin:4px 8px;background:var(--ot-line)}
.ot-mh{padding:6px 8px 2px;font-size:var(--text-xs,12px);color:var(--ot-faint)}
.ot-mi-input{width:100%;height:32px;padding:0 8px;border:1px solid var(--ot-line-strong);border-radius:8px;background:transparent;color:inherit;font:inherit;font-size:var(--text-sm,14px)}
.ot-sv{position:relative;width:136px;height:136px;border-radius:8px 8px 0 0;cursor:crosshair;touch-action:none;background-image:linear-gradient(to top,#000,rgba(0,0,0,0)),linear-gradient(to right,#fff,rgba(255,255,255,0))}
.ot-hue{position:relative;width:136px;height:24px;border-radius:0 0 8px 8px;cursor:ew-resize;touch-action:none;background:linear-gradient(to right,#f00 0%,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,#f00 100%)}
.ot-knob{position:absolute;width:28px;height:28px;margin:-14px 0 0 -14px;border-radius:9999px;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,.2);pointer-events:none}
.ot-hue .ot-knob{top:50%}
`;

const ICONS = {
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  chevronUp: '<path d="m18 15-6-6-6 6"/>',
  chevronRight: '<path d="m9 18 6-6-6-6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  download:
    '<path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/>',
  refresh:
    '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M8 16H3v5"/>',
  upload:
    '<path d="M12 3v12"/><path d="m17 8-5-5-5 5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>',
  trash:
    '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  image:
    '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
};

function icon(name, cls) {
  const span = E("span", {
    class: "ot-icon" + (cls ? " " + cls : ""),
    "aria-hidden": "true",
  });
  span.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    ICONS[name] +
    "</svg>";
  return span;
}

function styleNode() {
  return E("style", {}, CSS);
}

/* ── Layout ── */

function section(title, right, children) {
  return E("div", { class: "ot-section" }, [
    E("div", { class: "ot-section-head" }, [
      typeof title == "string"
        ? E("h3", { class: "ot-section-title" }, title)
        : title,
      right || "",
    ]),
    E("div", { class: "ot-stack" }, children),
  ]);
}

function card(rows) {
  return E("div", { class: "ot-card" }, rows.filter(Boolean));
}

function row(opts) {
  return E(
    "div",
    { class: "ot-row" + (opts.variant ? " " + opts.variant : "") },
    [
      E("div", { class: "ot-label-block" }, [
        E("div", { class: "ot-label", id: opts.id || null }, opts.label),
        opts.description
          ? E("div", { class: "ot-desc" }, opts.description)
          : "",
      ]),
      E("div", { class: "ot-control" }, [].concat(opts.control || [])),
    ],
  );
}

function button(label, opts) {
  opts = opts || {};
  return E(
    "button",
    {
      type: "button",
      class: "ot-btn" + (opts.kind ? " " + opts.kind : ""),
      disabled: opts.disabled ? "" : null,
      click: opts.onClick,
    },
    [opts.icon ? icon(opts.icon) : "", label],
  );
}

function iconButton(name, title, onClick) {
  return E(
    "button",
    {
      type: "button",
      class: "ot-iconbtn",
      title: title,
      "aria-label": title,
      click: onClick,
    },
    icon(name),
  );
}

/* The round "Aa" chip: accent glyph on the surface, ink-tinted rim. */
function swatch(theme, small) {
  const s = theme.surface || "#ffffff",
    a = theme.accent || "#3a83f7",
    i = theme.ink || "#0d0d0d";
  return E(
    "span",
    {
      class: "ot-aa" + (small ? " sm" : ""),
      style: `background:${s};color:${a};border-color:color-mix(in srgb, ${i} 16%, ${s})`,
      "aria-hidden": "true",
    },
    "Aa",
  );
}

/* ── Popovers ── */

let openPop = null;

function closePopover() {
  if (openPop) {
    const p = openPop;
    openPop = null;
    p.close();
  }
}

/* Floats `node` beside `anchor`: below and end-aligned by default, flipped
   when it would leave the viewport. side:'right' places a flyout. */
function place(node, anchor, opts) {
  const r = anchor.getBoundingClientRect();
  const vw = document.documentElement.clientWidth,
    vh = window.innerHeight;
  const w = node.offsetWidth,
    h = node.offsetHeight;
  let x, y;

  if (opts.side == "right") {
    x = r.right + 4;
    if (x + w > vw - 8) x = r.left - w - 4;
    y = r.top - 4;
  } else {
    x = opts.align == "start" ? r.left : r.right - w;
    y = r.bottom + (opts.offset || 6);
    if (y + h > vh - 8 && r.top - h - 6 > 8) y = r.top - h - (opts.offset || 6);
  }

  node.style.left = Math.max(8, Math.min(x, vw - w - 8)) + "px";
  node.style.top = Math.max(8, Math.min(y, vh - h - 8)) + "px";
}

function popover(anchor, content, opts) {
  opts = opts || {};
  closePopover();

  const node = E(
    "div",
    {
      class: "ot-pop" + (opts.cls ? " " + opts.cls : ""),
      role: opts.role || "dialog",
    },
    content,
  );
  const ac = new AbortController();
  const pop = {
    node: node,
    close() {
      ac.abort();
      node.remove();
      anchor.setAttribute("aria-expanded", "false");
      if (openPop === pop) openPop = null;
      if (opts.onClose) opts.onClose();
    },
  };

  document.body.appendChild(node);
  place(node, anchor, opts);
  anchor.setAttribute("aria-expanded", "true");
  openPop = pop;

  document.addEventListener(
    "pointerdown",
    (ev) => {
      if (
        !node.contains(ev.target) &&
        !anchor.contains(ev.target) &&
        !(ev.target.closest && ev.target.closest(".ot-pop"))
      )
        pop.close();
    },
    { capture: true, signal: ac.signal },
  );
  document.addEventListener(
    "keydown",
    (ev) => {
      if (ev.key == "Escape") {
        pop.close();
        anchor.focus();
      }
    },
    { signal: ac.signal },
  );
  window.addEventListener("resize", () => pop.close(), { signal: ac.signal });
  /* Page scroll detaches the float from its anchor; scrolling inside any
	   popover (a flyout submenu is a separate node) must not close it. */
  window.addEventListener(
    "scroll",
    (ev) => {
      if (!(ev.target.closest && ev.target.closest(".ot-pop"))) pop.close();
    },
    { capture: true, signal: ac.signal },
  );

  return pop;
}

/*
 * Menu items:
 *   { label, value, checked, dot, swatch, onSelect }
 *   { separator: true }
 *   { header: 'text' }
 *   { label, swatch, submenu: [items] }     flyout (nested inline when narrow)
 *   { node: Element }                        custom content
 */
function menuNodes(items, close) {
  const narrow = window.matchMedia("(max-width: 767px)").matches;
  const out = [];

  for (const it of items) {
    if (it.separator) {
      out.push(E("div", { class: "ot-sep", role: "separator" }));
      continue;
    }
    if (it.header) {
      out.push(E("div", { class: "ot-mh" }, it.header));
      continue;
    }
    if (it.node) {
      out.push(it.node);
      continue;
    }

    const lead =
      it.swatch ||
      (it.dot
        ? E("span", { class: "ot-dot", style: "background:" + it.dot })
        : "");

    if (it.submenu) {
      const btn = E(
        "button",
        {
          type: "button",
          class: "ot-mi",
          "aria-haspopup": "menu",
          "aria-expanded": "false",
        },
        [
          lead,
          E("span", { class: "ot-mi-text" }, it.label),
          icon(narrow ? "chevronDown" : "chevronRight"),
        ],
      );
      if (narrow) {
        const box = E(
          "div",
          { class: "ot-menu-scroll", hidden: "" },
          menuNodes(it.submenu, close),
        );
        btn.addEventListener("click", () => {
          box.hidden = !box.hidden;
          btn.setAttribute("aria-expanded", box.hidden ? "false" : "true");
        });
        out.push(btn, box);
      } else {
        let fly = null;
        const open = () => {
          if (fly) return;
          fly = E(
            "div",
            { class: "ot-pop wide", role: "menu" },
            E("div", { class: "ot-menu-scroll" }, menuNodes(it.submenu, close)),
          );
          document.body.appendChild(fly);
          place(fly, btn, { side: "right" });
          btn.setAttribute("aria-expanded", "true");
          const parent = btn.closest(".ot-pop");
          const shut = () => {
            if (fly) {
              fly.remove();
              fly = null;
              btn.setAttribute("aria-expanded", "false");
            }
          };
          parent.addEventListener("pointerover", (ev) => {
            if (ev.target.closest(".ot-mi") && !btn.contains(ev.target)) shut();
          });
          const mo = new MutationObserver(() => {
            if (!parent.isConnected) {
              shut();
              mo.disconnect();
            }
          });
          mo.observe(document.body, { childList: true });
        };
        btn.addEventListener("pointerenter", open);
        btn.addEventListener("click", open);
        btn.addEventListener("keydown", (ev) => {
          if (ev.key == "ArrowRight") open();
        });
        out.push(btn);
      }
      continue;
    }

    out.push(
      E(
        "button",
        {
          type: "button",
          class: "ot-mi",
          role: "menuitemradio",
          "aria-checked": it.checked ? "true" : "false",
          click: () => {
            close();
            it.onSelect && it.onSelect(it.value);
          },
        },
        [
          lead,
          E("span", { class: "ot-mi-text" }, it.label),
          it.checked ? icon("check", "ot-check") : "",
        ],
      ),
    );
  }

  return out;
}

function openMenu(anchor, items, opts) {
  opts = opts || {};
  let pop;
  const close = () => pop && pop.close();
  const body = opts.scroll
    ? E("div", { class: "ot-menu-scroll" }, menuNodes(items, close))
    : menuNodes(items, close);
  pop = popover(anchor, body, {
    cls: opts.cls || "wide",
    role: "menu",
    onClose: opts.onClose,
  });
  const first =
    pop.node.querySelector('[aria-checked="true"]') ||
    pop.node.querySelector(".ot-mi");
  if (first) {
    first.focus({ preventScroll: true });
    /* A long list opens on the current choice, not on its first rows. */
    const box = first.closest(".ot-menu-scroll");
    if (box)
      box.scrollTop =
        first.offsetTop -
        box.offsetTop -
        (box.clientHeight - first.offsetHeight) / 2;
  }
  return pop;
}

/* Dropdown pill: the trigger every menu in the page uses. */
function pill(opts) {
  const btn = E(
    "button",
    {
      type: "button",
      class: "ot-pill" + (opts.cls ? " " + opts.cls : ""),
      "aria-haspopup": "menu",
      "aria-expanded": "false",
      "aria-label": opts.ariaLabel || null,
      disabled: opts.disabled ? "" : null,
    },
    [
      E("span", { class: "ot-pill-main" }, [
        opts.swatch ||
          (opts.dot
            ? E("span", { class: "ot-dot", style: "background:" + opts.dot })
            : ""),
        E("span", { class: "ot-pill-text" }, opts.label),
      ]),
      icon("chevronDown", "ot-chev"),
    ],
  );
  btn.addEventListener("click", () => {
    if (btn.getAttribute("aria-expanded") == "true") return closePopover();
    openMenu(
      btn,
      typeof opts.items == "function" ? opts.items() : opts.items,
      opts.menu,
    );
  });
  return btn;
}

/* ── Colour chip + HSV picker ── */

function hexToHsv(h) {
  const n = parseInt(h.slice(1), 16);
  const r = ((n >> 16) & 255) / 255,
    g = ((n >> 8) & 255) / 255,
    b = (n & 255) / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = max - min;
  let hue = 0;
  if (d) {
    if (max == r) hue = ((g - b) / d) % 6;
    else if (max == g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue = (hue * 60 + 360) % 360;
  }
  return { h: hue, s: max ? d / max : 0, v: max };
}

function hsvToHex(c) {
  const f = (k) => {
    const x = (k + c.h / 60) % 6;
    return c.v - c.v * c.s * Math.max(0, Math.min(x, 4 - x, 1));
  };
  return (
    "#" +
    [f(5), f(3), f(1)]
      .map((v) =>
        Math.round(v * 255)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}

/* A pointer drag on `el` reporting 0..1 coordinates. */
function drag(el, onMove, onEnd) {
  el.addEventListener("pointerdown", (ev) => {
    ev.preventDefault();
    el.setPointerCapture(ev.pointerId);
    const at = (e) => {
      const r = el.getBoundingClientRect();
      onMove(
        Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
        Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)),
      );
    };
    at(ev);
    const move = (e) => at(e);
    const up = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      onEnd && onEnd();
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  });
}

function picker(value, onInput, onCommit) {
  let hsv = hexToHsv(value);
  const svKnob = E("span", { class: "ot-knob" });
  const hueKnob = E("span", { class: "ot-knob" });
  const sv = E(
    "div",
    { class: "ot-sv", role: "slider", "aria-label": _("Color") },
    svKnob,
  );
  const hue = E(
    "div",
    { class: "ot-hue", role: "slider", "aria-label": _("Hue") },
    hueKnob,
  );

  const paint = () => {
    const hex = hsvToHex(hsv);
    sv.style.backgroundColor = hsvToHex({ h: hsv.h, s: 1, v: 1 });
    svKnob.style.left = hsv.s * 100 + "%";
    svKnob.style.top = (1 - hsv.v) * 100 + "%";
    svKnob.style.background = hex;
    hueKnob.style.left = (hsv.h / 360) * 100 + "%";
    hueKnob.style.background = hsvToHex({ h: hsv.h, s: 1, v: 1 });
    return hex;
  };

  drag(
    sv,
    (x, y) => {
      hsv.s = x;
      hsv.v = 1 - y;
      onInput(paint());
    },
    () => onCommit(hsvToHex(hsv)),
  );
  drag(
    hue,
    (x) => {
      hsv.h = Math.min(359.9, x * 360);
      onInput(paint());
    },
    () => onCommit(hsvToHex(hsv)),
  );
  paint();

  return {
    node: E("div", {}, [sv, hue]),
    set(hex) {
      hsv = hexToHsv(hex);
      paint();
    },
  };
}

/*
 * Background / Foreground / custom Accent chip: a dot that opens the picker
 * and an inline hex field. Typing is sanitised to #RRGGBB and only a full
 * value commits; an incomplete draft reverts on blur. onInput fires while
 * dragging (live preview), onCommit once a value settles.
 */
function colorChip(opts) {
  let value = opts.value.toLowerCase();
  const dot = E("button", {
    type: "button",
    "aria-label": opts.label,
    "aria-haspopup": "dialog",
    "aria-expanded": "false",
    style: "background:" + value,
  });
  const input = E("input", {
    type: "text",
    value: value.toUpperCase(),
    spellcheck: "false",
    autocomplete: "off",
    maxlength: "7",
    "aria-label": opts.label,
  });
  let pick = null;

  const show = (hex) => {
    dot.style.background = hex;
    if (document.activeElement !== input) input.value = hex.toUpperCase();
  };
  const commit = (hex) => {
    hex = hex.toLowerCase();
    if (hex == value) return;
    value = hex;
    show(hex);
    opts.onCommit(hex);
  };

  input.addEventListener("input", () => {
    let v =
      "#" +
      input.value
        .toUpperCase()
        .replace(/[^0-9A-F]/g, "")
        .slice(0, 6);
    input.value = v;
    if (/^#[0-9A-F]{6}$/.test(v)) {
      dot.style.background = v;
      pick && pick.set(v);
      opts.onInput && opts.onInput(v.toLowerCase());
    }
  });
  const settle = () => {
    if (/^#[0-9A-Fa-f]{6}$/.test(input.value)) commit(input.value);
    else input.value = value.toUpperCase();
  };
  input.addEventListener("blur", settle);
  input.addEventListener("keydown", (ev) => {
    if (ev.key == "Enter") {
      settle();
      input.blur();
    }
  });

  dot.addEventListener("click", () => {
    if (dot.getAttribute("aria-expanded") == "true") return closePopover();
    let live = value;
    pick = picker(
      value,
      (hex) => {
        live = hex;
        show(hex);
        opts.onInput && opts.onInput(hex);
      },
      (hex) => commit(hex),
    );
    popover(dot, pick.node, {
      cls: "picker",
      offset: 8,
      onClose: () => {
        pick = null;
        if (live != value) commit(live);
        opts.onClose && opts.onClose();
      },
    });
  });

  return E("div", { class: "ot-chip" }, [dot, input]);
}

/* ── Controls ── */

function toggle(checked, onChange, label) {
  const btn = E("button", {
    type: "button",
    class: "ot-toggle",
    role: "switch",
    "aria-checked": checked ? "true" : "false",
    "aria-label": label || null,
  });
  btn.addEventListener("click", () => {
    const next = btn.getAttribute("aria-checked") != "true";
    btn.setAttribute("aria-checked", next ? "true" : "false");
    onChange(next);
  });
  return btn;
}

function segmented(options, value, onChange) {
  const wrap = E("div", { class: "ot-seg", role: "group" });
  for (const o of options) {
    wrap.appendChild(
      E(
        "button",
        {
          type: "button",
          "aria-pressed": o.value == value ? "true" : "false",
          click: (ev) => {
            wrap
              .querySelectorAll("button")
              .forEach((b) => b.setAttribute("aria-pressed", "false"));
            ev.currentTarget.setAttribute("aria-pressed", "true");
            onChange(o.value);
          },
        },
        o.label,
      ),
    );
  }
  return wrap;
}

/* Font-size field: commits on blur, Enter, or a spinner click; an
   out-of-range or unparsable value reverts to the stored one. */
function sizeField(value, min, max, onCommit, label) {
  const input = E("input", {
    type: "number",
    step: "1",
    min: min,
    max: max,
    value: value,
    "aria-label": label,
  });
  let stored = value,
    pressed = false;
  const commit = () => {
    const v = parseFloat(input.value);
    if (isNaN(v) || v < min || v > max) {
      input.value = stored;
      return;
    }
    const n = Math.round(v);
    input.value = n;
    if (n != stored) {
      stored = n;
      onCommit(n);
    }
  };
  input.addEventListener("blur", commit);
  input.addEventListener("keydown", (ev) => {
    if (ev.key == "Enter") commit();
  });
  input.addEventListener("pointerdown", () => {
    pressed = true;
  });
  input.addEventListener("pointerup", () => {
    if (pressed) {
      pressed = false;
      commit();
    }
  });
  return E("div", { class: "ot-num" }, [input, E("span", {}, "px")]);
}

function slider(opts) {
  const out = E("output", {}, String(opts.value));
  const input = E("input", {
    type: "range",
    min: opts.min,
    max: opts.max,
    step: "1",
    value: opts.value,
    "aria-label": opts.label,
  });
  const tint = (a, s) => {
    input.style.background = `linear-gradient(90deg, color-mix(in srgb, ${a} 35%, ${s}) 0%, ${a} 32%, ${a} 100%)`;
    input.style.height = "2px";
  };
  if (opts.accent) tint(opts.accent, opts.surface || "#ffffff");
  input.addEventListener("input", () => {
    out.textContent = input.value;
    opts.onInput && opts.onInput(+input.value);
  });
  input.addEventListener("change", () => opts.onCommit(+input.value));
  return E("div", { class: "ot-slider" }, [input, out]);
}

/* ── Mode thumbnails ── */

/* 80x60 sketch of a window: sidebar, accent and grey text lines, composer
   pill with an accent dot. currentColor carries the live accent. */
function sketch(dark, half) {
  const bg = dark ? "#262626" : "#f4f4f4";
  const win = dark ? "#0d0d0d" : "#ffffff";
  const edge = dark ? "rgba(255,255,255,.1)" : "rgba(0,0,0,.1)";
  const grey = dark ? "rgba(255,255,255,.3)" : "rgba(0,0,0,.1)";
  const side = dark ? "rgba(255,255,255,.2)" : "rgba(0,0,0,.03)";
  const vb = half ? (half == "left" ? "0 0 40 60" : "40 0 40 60") : "0 0 80 60";
  return (
    '<svg viewBox="' +
    vb +
    '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<rect width="80" height="60" fill="' +
    bg +
    '"/>' +
    '<rect x="8" y="8" width="64" height="44" rx="4" fill="' +
    win +
    '" stroke="' +
    edge +
    '" stroke-width=".5"/>' +
    '<path d="M12 8h8v44h-8a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4z" fill="' +
    side +
    '"/>' +
    '<circle cx="14" cy="14" r="2.5" fill="none" stroke="' +
    grey +
    '" stroke-width="1"/>' +
    '<rect x="38" y="12" width="30" height="2" rx="1" fill="currentColor"/>' +
    '<rect x="24" y="18" width="30" height="2" rx="1" fill="' +
    grey +
    '"/>' +
    '<rect x="24" y="22" width="18" height="2" rx="1" fill="' +
    grey +
    '"/>' +
    '<rect x="24" y="26" width="36" height="2" rx="1" fill="' +
    grey +
    '"/>' +
    '<rect x="29" y="32" width="39" height="2" rx="1" fill="currentColor"/>' +
    '<rect x="45" y="36" width="23" height="2" rx="1" fill="currentColor"/>' +
    '<rect x="23.75" y="41.75" width="44.5" height="6.5" rx="3.25" fill="' +
    win +
    '" stroke="' +
    edge +
    '" stroke-width=".5"/>' +
    '<circle cx="65" cy="45" r="2" fill="currentColor"/>' +
    "</svg>"
  );
}

function modePicker(value, onChange) {
  const opts = [
    { value: "system", label: _("System") },
    { value: "light", label: _("Light") },
    { value: "dark", label: _("Dark") },
  ];
  const name = "ot-mode-" + Math.random().toString(36).slice(2, 8);
  return E(
    "div",
    { class: "ot-modes", role: "radiogroup", "aria-label": _("Mode") },
    opts.map((o) => {
      const tile = E("span", {
        class: "ot-tile" + (o.value == "system" ? " split" : ""),
      });
      tile.innerHTML =
        o.value == "system"
          ? sketch(false, "left") + sketch(true, "left")
          : sketch(o.value == "dark");
      const radio = E("input", {
        type: "radio",
        name: name,
        value: o.value,
        "aria-label": o.label,
        checked: o.value == value ? "" : null,
        change: () => onChange(o.value),
      });
      return E("label", { class: "ot-mode", title: o.label }, [radio, tile]);
    }),
  );
}

/* Navigation sketches in the current theme's own colours: the page,
   the sidebar or the floating pills and card, accent for the current item. */
function navSketch(kind) {
  const f = (v) => 'style="fill:var(' + v + ')"';
  const page = f("--ot-panel"),
    shell = f("--ot-fill"),
    line = f("--ot-line-strong");
  const pill =
    'style="fill:var(--ot-pop);stroke:var(--ot-line)" stroke-width=".5"';
  let body;
  if (kind == "navbar")
    body =
      '<rect x="12" y="11" width="13" height="6" rx="3" ' +
      pill +
      "/>" +
      '<rect x="27" y="11" width="28" height="6" rx="3" ' +
      pill +
      "/>" +
      '<rect x="28.5" y="12.5" width="9" height="3" rx="1.5" fill="currentColor"/>' +
      '<circle cx="65" cy="14" r="3" ' +
      pill +
      "/>" +
      '<rect x="27" y="20" width="16" height="15" rx="3" ' +
      pill +
      "/>" +
      '<rect x="30" y="24" width="9" height="2" rx="1" fill="currentColor"/>' +
      '<rect x="30" y="29" width="7" height="2" rx="1" ' +
      line +
      "/>" +
      '<rect x="14" y="40" width="40" height="2" rx="1" ' +
      line +
      "/>" +
      '<rect x="14" y="45" width="28" height="2" rx="1" ' +
      line +
      "/>";
  else
    body =
      '<path d="M12 8h14v44H12a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4z" ' +
      shell +
      "/>" +
      '<rect x="11" y="13" width="11" height="2" rx="1" fill="currentColor"/>' +
      '<rect x="11" y="18" width="9" height="2" rx="1" ' +
      line +
      "/>" +
      '<rect x="11" y="23" width="10" height="2" rx="1" ' +
      line +
      "/>" +
      '<rect x="11" y="28" width="8" height="2" rx="1" ' +
      line +
      "/>" +
      '<rect x="31" y="14" width="26" height="2" rx="1" ' +
      line +
      "/>" +
      '<rect x="31" y="19" width="34" height="2" rx="1" ' +
      line +
      "/>" +
      '<rect x="31" y="24" width="20" height="2" rx="1" ' +
      line +
      "/>";
  return (
    '<svg viewBox="0 0 80 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<rect width="80" height="60" ' +
    shell +
    "/>" +
    '<rect x="8" y="8" width="64" height="44" rx="4" ' +
    page +
    ' stroke="var(--ot-line)" stroke-width=".5"/>' +
    body +
    "</svg>"
  );
}

/* Appearance › Navigation: the ChatGPT sidebar or the floating navbar. */
function navPicker(value, onChange) {
  const opts = [
    { value: "sidebar", label: _("Sidebar") },
    { value: "navbar", label: _("Navbar") },
  ];
  const name = "ot-nav-" + Math.random().toString(36).slice(2, 8);
  return E(
    "div",
    {
      class: "ot-modes two",
      role: "radiogroup",
      "aria-label": _("Navigation"),
    },
    opts.map((o) => {
      const tile = E("span", { class: "ot-tile" });
      tile.innerHTML = navSketch(o.value);
      const radio = E("input", {
        type: "radio",
        name: name,
        value: o.value,
        "aria-label": o.label,
        checked: o.value == value ? "" : null,
        change: () => onChange(o.value),
      });
      return E("label", { class: "ot-mode", title: o.label }, [radio, tile]);
    }),
  );
}

/* ── Feedback ── */

function toast(text, type) {
  if (ui.addTimeLimitedNotification)
    ui.addTimeLimitedNotification(null, E("p", {}, text), 4000, type || "info");
  else ui.addNotification(null, E("p", {}, text), type || "info");
}

/* Clipboard writes need a secure context; LuCI is often served over plain
   http, so fall back to a hidden textarea and execCommand. */
function copyText(text) {
  if (navigator.clipboard && window.isSecureContext)
    return navigator.clipboard.writeText(text);
  return new Promise((resolve, reject) => {
    const ta = E(
      "textarea",
      { style: "position:fixed;left:-9999px;top:0;opacity:0" },
      text,
    );
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (e) {}
    ta.remove();
    ok ? resolve() : reject(new Error("copy"));
  });
}

return baseclass.extend({
  styleNode: styleNode,
  icon: icon,
  section: section,
  card: card,
  row: row,
  button: button,
  iconButton: iconButton,
  swatch: swatch,
  popover: popover,
  closePopover: closePopover,
  openMenu: openMenu,
  pill: pill,
  colorChip: colorChip,
  toggle: toggle,
  segmented: segmented,
  sizeField: sizeField,
  slider: slider,
  modePicker: modePicker,
  navPicker: navPicker,
  toast: toast,
  copyText: copyText,
  hexToHsv: hexToHsv,
  hsvToHex: hsvToHex,
});
