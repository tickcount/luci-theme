// Loads a System › Outline Theme module from .dev/src/resource in node. A module's
// body is a function whose last statement is `return baseclass.extend({...})`;
// `'require x as y'` directives become parameters we inject.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const src = join(root, ".dev/src/resource");
export const resource = (p) => join(src, p);

// LuCI's String.prototype.format, enough for %s / %d.
if (!String.prototype.format)
  String.prototype.format = function (...args) {
    let i = 0;
    return this.replace(/%[sd]/g, () => String(args[i++]));
  };
globalThis._ = (s) => s;

export function source(path) {
  return readFileSync(resource(path), "utf8");
}

export function loadModule(path, deps = {}) {
  const baseclass = { extend: (o) => o };
  const all = { baseclass, ...deps };
  return new Function(...Object.keys(all), source(path))(...Object.values(all));
}

export function loadAll() {
  const palette = loadModule("outline/palette.js");
  const presets = loadModule("outline/presets.js");
  const share = loadModule("outline/share.js", { palette, presets });
  return { palette, presets, share };
}
