const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../scripts/js/All/add_chained_proxy.js"), "utf8");
const context = vm.createContext({});
vm.runInContext(source, context);
const main = (config) => JSON.parse(JSON.stringify(context.main(JSON.parse(JSON.stringify(config)))));
const chain = "[MINE]🇺🇸|美国-住宅链式-01";
const group = "前置代理:美国-住宅链式-01";
const fixture = {
  proxies: [
    { name: "[MINE]🇯🇵|日本-高速隧道-01", type: "vless" },
    { name: chain, type: "vless", uuid: "test-only", "dialer-proxy": `${chain}-前置选择` },
    { name: "nested", "dialer-proxy": chain },
    { name: "剩余流量 100GB" },
  ],
  "proxy-groups": [
    { name: "GLOBAL", type: "select", proxies: ["住宅前置选择", "日本节点", `${chain}-前置选择`] },
    { name: "日本节点", type: "select", proxies: ["[MINE]🇯🇵|日本-高速隧道-01"] },
    { name: "住宅前置选择", type: "select" },
    { name: `${chain}-前置选择`, type: "select" },
    { name: "旧节点-前置选择", type: "select" },
  ],
};
const result = main(fixture);
assert.equal(result.proxies[1].name, chain);
assert.equal(result.proxies[1].uuid, "test-only");
assert.equal(result.proxies[1]["dialer-proxy"], group);
assert.deepEqual(result["proxy-groups"].at(-1), {
  name: group, type: "select", proxies: ["[MINE]🇯🇵|日本-高速隧道-01"],
});
assert.deepEqual(result["proxy-groups"][0].proxies, ["日本节点", group]);
assert.ok(!result["proxy-groups"].some((g) => g.name === "住宅前置选择"));
assert.deepEqual(main(result), result, "must be idempotent");
const empty = main({ proxies: [{ name: chain }], "proxy-groups": [] });
assert.deepEqual(empty["proxy-groups"][0].proxies, ["REJECT"]);
const gone = main({ proxies: [], "proxy-groups": result["proxy-groups"] });
assert.ok(!gone["proxy-groups"].some((g) => g.name.startsWith("前置代理:")));
assert.ok(!gone["proxy-groups"][0].proxies.includes(group));
const collision = main({ proxies: [{ name: "[A]🇺🇸|美国-住宅链式-01" }, { name: "[B]·美国-住宅链式-01" }] });
assert.equal(new Set(collision["proxy-groups"].map((g) => g.name)).size, 2);
assert.deepEqual(main(collision), collision);
assert.equal(main(null), null);
assert.deepEqual(main({}), {});
assert.doesNotMatch(source, /38\.134|39443|[0-9a-f]{8}-[0-9a-f-]{27}/i);
console.log("add_chained_proxy: naming, GLOBAL order, legacy cleanup, collision, fail-closed and idempotence OK");
