const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const config = fs.readFileSync(path.join(root, "scripts/yaml/Config/v1.2.0.yaml"), "utf8");
const base = fs.readFileSync(path.join(root, "scripts/yaml/All/v1.0.10.yaml"), "utf8");
const chain = fs.readFileSync(path.join(root, "scripts/js/All/add_chained_proxy.js"), "utf8");

assert.deepEqual([...config.matchAll(/^(\S+):/gm)].map((match) => match[1]), ["dns", "tun"]);
assert.equal(config.charCodeAt(0) === 0xfeff, false);
assert.equal(config.includes("\t"), false);
assert.doesNotMatch(config, /system:\/\/|global-client-fingerprint/);
assert.match(config, /^  respect-rules: false$/m);
assert.match(config, /^  cache-max-size: 4096$/m);
assert.match(config, /^  dns-mode: hijack$/m);
assert.match(config, /^  strict-route: true$/m);
assert.match(config, /^  mtu: 1500$/m);
assert.match(config, /"udp:\/\/any:53"/);
assert.match(config, /"tcp:\/\/any:53"/);
assert.doesNotMatch(config, /192\.168\.|10\.77\.|system$/m);
assert.match(config, /https:\/\/1\.1\.1\.1\/dns-query#节点选择/);
assert.match(config, /https:\/\/223\.6\.6\.6\/dns-query#DIRECT/);
assert.match(base, /^  - name: 节点选择$/m);
for (const provider of ["U_AI", "U_GFW", "U_CN_DOMAIN"]) {
  assert.match(base, new RegExp(`^  ${provider}:$`, "m"));
  assert.ok(config.includes(provider));
}

// 集成验证配置层拼接不覆盖原有代理组、规则及节点。
const merged = `${base}\n${config}`;
for (const key of ["dns", "tun", "proxy-groups", "rules", "rule-providers"]) {
  assert.equal([...merged.matchAll(new RegExp(`^${key}:`, "gm"))].length, 1);
}
const context = vm.createContext({});
vm.runInContext(chain, context);
const input = {
  proxies: [{ name: "日本节点-01", type: "socks5", server: "127.0.0.1", port: 1080 }],
  "proxy-groups": [{ name: "节点选择", type: "select", proxies: ["日本节点-01"] }],
  dns: { source: config },
  tun: { enable: true, "strict-route": true },
};
const before = JSON.stringify({ dns: input.dns, tun: input.tun });
const output = context.main(input);
assert.equal(JSON.stringify({ dns: output.dns, tun: output.tun }), before);
assert.ok(output["proxy-groups"].some((group) => group.name === "节点选择"));
console.log("通过：统一 TUN/DNS 配置约束、分层合并及链式后处理集成验证");
