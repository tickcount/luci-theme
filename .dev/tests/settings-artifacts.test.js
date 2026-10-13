import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { root, src } from "./settings-load.js";

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    statSync(p).isDirectory() ? walk(p, out) : out.push(p);
  }
  return out;
}

const js = [
  ...walk(join(src, "outline")),
  ...walk(join(src, "view/outline")),
].filter((f) => f.endsWith(".js"));

test("every LuCI module parses as a function body", () => {
  for (const f of js) {
    const src = readFileSync(f, "utf8");
    assert.doesNotThrow(() => new Function(src), f);
    assert.match(src, /^(["'])use strict\1;\n\1require /, f);
    assert.match(src, /\nreturn (baseclass|view)\.extend\(/, f);
  }
});

test("menu and ACL agree on the rpc methods the views call", () => {
  const acl = JSON.parse(
    readFileSync(
      join(root, "root/usr/share/rpcd/acl.d/luci-theme-outline.json"),
      "utf8",
    ),
  )["luci-theme-outline"];
  const allowed = new Set([
    ...acl.read.ubus["luci.outline"],
    ...acl.write.ubus["luci.outline"],
  ]);
  const backend = readFileSync(
    join(root, "root/usr/share/rpcd/ucode/luci.outline"),
    "utf8",
  );
  for (const f of js) {
    for (const [, m] of readFileSync(f, "utf8").matchAll(
      /object: ["']luci\.outline["'],\s*method: ["']([a-z_]+)["']/g,
    )) {
      assert.ok(allowed.has(m), `${m} missing from ACL`);
      assert.match(
        backend,
        new RegExp(`\\n\\t${m}: \\{`),
        `${m} missing from rpcd`,
      );
    }
  }
  const menu = JSON.parse(
    readFileSync(
      join(root, "root/usr/share/luci/menu.d/luci-theme-outline.json"),
      "utf8",
    ),
  );
  for (const node of Object.values(menu))
    if (node.action.type == "view")
      assert.ok(
        js.some((f) => f.endsWith(`view/${node.action.path}.js`)),
        node.action.path,
      );
});

test("the job worker only accepts fixed actions", () => {
  const job = readFileSync(join(root, "root/usr/libexec/outline/job"), "utf8");
  assert.match(job, /\*\) fail invalid ;;/);
  assert.ok(
    statSync(join(root, "root/usr/libexec/outline/job")).mode & 0o100,
    "job must be executable",
  );
});
