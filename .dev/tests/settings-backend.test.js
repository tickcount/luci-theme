import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { root } from "./settings-load.js";

// `ucode -c` compiles a call to an undefined function without complaint; it
// only fails when that line runs. So every call in the rpcd backend must name
// a function defined in the file, an imported one, a local arrow helper, or a
// ucode builtin.
const BUILTINS = new Set(
  (
    "match replace lc uc trim ltrim rtrim substr length push pop shift unshift keys values " +
    "index rindex join split sprintf printf print json type int hex ord chr time system sort filter map exists " +
    "regexp die warn exit include require call uniq reverse slice splice min max wildcard b64enc b64dec"
  ).split(" "),
);
const KEYWORDS = new Set(
  "if for while switch function return catch typeof".split(" "),
);

test("the rpcd backend calls only functions that exist", () => {
  const src = readFileSync(
    join(root, "root/usr/share/rpcd/ucode/luci.outline"),
    "utf8",
  )
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "")
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
    .replace(/`(?:[^`\\]|\\.)*`/g, "``");
  const defined = new Set([
    ...[...src.matchAll(/\bfunction\s+([A-Za-z_]\w*)/g)].map((m) => m[1]),
    ...[...src.matchAll(/\bconst\s+([A-Za-z_]\w*)\s*=\s*\(/g)].map((m) => m[1]),
    ...[...src.matchAll(/^import\s*\{([^}]*)\}/gm)].flatMap((m) =>
      m[1].split(",").map((x) => x.trim()),
    ),
  ]);
  const missing = new Set();
  for (const m of src.matchAll(/(^|[^.\w])([A-Za-z_]\w*)\s*\(/g)) {
    const name = m[2];
    if (!KEYWORDS.has(name) && !BUILTINS.has(name) && !defined.has(name))
      missing.add(name);
  }
  assert.deepEqual([...missing], []);
});
