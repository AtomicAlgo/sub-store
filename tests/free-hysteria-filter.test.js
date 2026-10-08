const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const scriptPath = path.join(root, "scripts", "js", "Free", "v1.0.1.js");
const source = fs.readFileSync(scriptPath, "utf8");
const context = vm.createContext({});
vm.runInContext(source, context, { filename: scriptPath });

async function run() {
  const config = {
    proxies: [
      {
        name: "hy2-empty-speed",
        type: "hysteria2",
        server: "hy2.example.com",
        up: "",
        down: null,
        "up-speed": "  ",
        "down-speed": undefined,
      },
      {
        name: "hy1-valid",
        type: "hysteria",
        server: "hy1.example.com",
        up: "10",
        down: "50",
      },
      {
        name: "hy1-repaired",
        type: "HYSTERIA",
        server: "repaired.example.com",
        up: "",
        down: null,
        "up-speed": 20,
        "down-speed": "80",
      },
      {
        name: "hy1-missing-speed",
        type: "hysteria",
        server: "broken.example.com",
        up: "",
        down: "50",
      },
      {
        name: "hy1-invalid-server",
        type: "hysteria",
        server: "  @broken.example.com",
        up: "10",
        down: "50",
      },
      { name: "trojan-unchanged", type: "trojan", server: "trojan.example.com" },
      null,
    ],
  };

  const result = await context.main(config);
  assert.strictEqual(result, config, "应返回原配置对象");
  assert.deepEqual(
    result.proxies.map((proxy) => proxy.name),
    ["hy2-empty-speed", "hy1-valid", "hy1-repaired", "trojan-unchanged"],
  );

  const hy2 = result.proxies[0];
  for (const key of ["up", "down", "up-speed", "down-speed"]) {
    assert.equal(key in hy2, false, `Hysteria2 空字段 ${key} 应被删除`);
  }

  const repaired = result.proxies[2];
  assert.equal(repaired.up, 20);
  assert.equal(repaired.down, "80");
  assert.deepEqual(result.proxies[3], {
    name: "trojan-unchanged",
    type: "trojan",
    server: "trojan.example.com",
  });

  assert.equal(await context.main(null), null);
  const emptyResult = await context.main({});
  assert.equal(Array.isArray(emptyResult.proxies), true);
  assert.equal(emptyResult.proxies.length, 0);
}

run()
  .then(() => console.log("通过：Free Hysteria 异常节点过滤测试"))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
