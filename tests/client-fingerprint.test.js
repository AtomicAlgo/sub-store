const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const scriptPath = path.join(root, "scripts", "js", "ClientFingerprint.js");
const source = fs.readFileSync(scriptPath, "utf8");
const context = vm.createContext({});
vm.runInContext(source, context, { filename: scriptPath });

const config = {
  "global-client-fingerprint": "chrome",
  proxies: [
    { name: "a", type: "trojan" },
    { name: "b", type: "anytls", "client-fingerprint": "firefox" },
    { name: "c", type: "vless", tls: true },
    { name: "d", type: "vmess", tls: false },
    { name: "e", type: "ss" },
    null,
  ],
};

const result = context.main(config);
assert.strictEqual(result, config, "应返回原配置对象");
assert.equal("global-client-fingerprint" in result, false, "应删除废弃顶层字段");
assert.equal(result.proxies[0]["client-fingerprint"], "chrome");
assert.equal(result.proxies[1]["client-fingerprint"], "firefox", "不得覆盖节点自定义值");
assert.equal(result.proxies[2]["client-fingerprint"], "chrome");
assert.equal("client-fingerprint" in result.proxies[3], false, "非 TLS VMess 不应添加字段");
assert.equal("client-fingerprint" in result.proxies[4], false, "非 TLS 协议不应添加字段");
assert.equal(context.main(null), null, "空配置应安全返回");

const yamlRoot = path.join(root, "scripts", "yaml");
const yamlFiles = [];
for (const category of fs.readdirSync(yamlRoot)) {
  const categoryPath = path.join(yamlRoot, category);
  if (!fs.statSync(categoryPath).isDirectory()) continue;
  for (const file of fs.readdirSync(categoryPath)) {
    if (/^v\d+(?:\.\d+)+\.yaml$/.test(file)) {
      yamlFiles.push(path.join(categoryPath, file));
    }
  }
}

assert.ok(yamlFiles.length > 0, "至少应存在一个 YAML 模板");
for (const file of yamlFiles) {
  const yaml = fs.readFileSync(file, "utf8");
  assert.equal(
    /^global-client-fingerprint\s*:/m.test(yaml),
    false,
    `${path.relative(root, file)} 不应包含废弃顶层字段`,
  );
}

console.log(`通过：逐代理指纹单元测试及 ${yamlFiles.length} 个 YAML 模板兼容检查`);
