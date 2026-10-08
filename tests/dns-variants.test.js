const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const yamlRoot = path.join(root, "scripts", "yaml");

function readYaml(category, version) {
  return fs.readFileSync(path.join(yamlRoot, category, `${version}.yaml`), "utf8");
}

function topLevelKeys(yaml) {
  return [...yaml.matchAll(/^([A-Za-z0-9_-]+):(?:\s.*)?$/gm)].map((match) => match[1]);
}

function countTopLevel(yaml, key) {
  return topLevelKeys(yaml).filter((item) => item === key).length;
}

const redirHost = readYaml("Config", "v1.0.0");
const fakeIp = readYaml("Config", "v1.1.0");

for (const [version, yaml] of [
  ["v1.0.0", redirHost],
  ["v1.1.0", fakeIp],
]) {
  assert.deepEqual(topLevelKeys(yaml), ["dns", "tun"], `${version} 顶层只能包含 dns 和 tun`);
  assert.equal(countTopLevel(yaml, "dns"), 1);
  assert.equal(countTopLevel(yaml, "tun"), 1);
  assert.equal(yaml.includes("system://"), false, `${version} 不得回退到系统 DNS`);
  assert.equal(yaml.includes("global-client-fingerprint"), false);
  assert.equal(yaml.includes("\t"), false, `${version} 不得包含 Tab 缩进`);
  assert.doesNotMatch(yaml, /^(?:proxy-groups|rule-providers|rules|proxies):/m);
  assert.doesNotMatch(yaml, /^\s+(?:password|uuid|token|secret|private-key):/m);
  assert.match(yaml, /^\s{2}use-system-hosts: false$/m);
  assert.match(yaml, /^\s{2}respect-rules: true$/m);
  assert.match(yaml, /^\s{2}stack: mixed$/m);
  assert.match(yaml, /^\s{2}auto-route: true$/m);
  assert.match(yaml, /^\s{2}auto-detect-interface: true$/m);
  assert.match(yaml, /^\s{2}strict-route: true$/m);
  assert.match(yaml, /^\s{4}- "any:53"$/m);
}

assert.match(redirHost, /^\s{2}enhanced-mode: redir-host$/m);
assert.equal(/fake-ip-(?:range|filter|filter-mode):/m.test(redirHost), false);

assert.match(fakeIp, /^\s{2}enhanced-mode: fake-ip$/m);
assert.match(fakeIp, /^\s{2}fake-ip-range: 198\.18\.0\.1\/16$/m);
assert.match(fakeIp, /^\s{2}fake-ip-filter-mode: rule$/m);
assert.match(
  fakeIp,
  /fake-ip-filter:\r?\n\s{4}- GEOSITE,gfw,fake-ip\r?\n\s{4}- MATCH,real-ip/,
);

assert.equal(
  redirHost.slice(redirHost.indexOf("tun:")),
  fakeIp.slice(fakeIp.indexOf("tun:")),
  "两个配置层必须使用相同的 TUN 配置",
);

for (const category of ["All", "Free", "Mine"]) {
  for (const version of ["v1.2.0", "v1.3.0"]) {
    assert.equal(
      fs.existsSync(path.join(yamlRoot, category, `${version}.yaml`)),
      false,
      `${category} 不应再包含 ${version}`,
    );
  }
}

const proxyLayers = [
  ["All", "v1.0.6"],
  ["Free", "v1.0.1"],
  ["Mine", "v1.0.1"],
];

for (const [category, version] of proxyLayers) {
  const proxyLayer = readYaml(category, version);
  assert.match(proxyLayer, /^proxy-groups:$/m, `${category} 必须提供代理组层`);
  assert.equal(countTopLevel(proxyLayer, "dns"), 0, `${category} 不得包含 DNS 层`);
  assert.equal(countTopLevel(proxyLayer, "tun"), 0, `${category} 不得包含 TUN 层`);

  for (const [configVersion, configLayer] of [
    ["v1.0.0", redirHost],
    ["v1.1.0", fakeIp],
  ]) {
    const mergedKeys = topLevelKeys(`${proxyLayer}\n${configLayer}`);
    assert.equal(new Set(mergedKeys).size, mergedKeys.length, `${category} + ${configVersion} 存在重复顶层键`);
    for (const key of ["dns", "tun", "proxy-groups", "rule-providers", "rules"]) {
      assert.equal(
        mergedKeys.filter((item) => item === key).length,
        1,
        `${category} + ${configVersion} 必须且只能包含一个 ${key}`,
      );
    }
  }
}

console.log("通过：Config DNS/TUN 分层及 All、Free、Mine 边界检查");
