/**
 * FlClash 二次覆写：为现有地区组/服务组启用按需 URLTest
 *
 * 设计目标：
 * 1. 不新增“美国自动1x/日本自动1x”等重复组，直接把现有地区/服务组切换为 url-test。
 * 2. “节点选择”与“GLOBAL”保留 select，作为控制入口，保证仍可切到“手动切换”。
 * 3. “手动切换”永远保持 select，且允许 2x/2.5x/3x/5x 等高倍率节点。
 * 4. 所有直接扫描原始节点的自动组都会排除 >1x 的明确倍率标记。
 * 5. 服务组（AI服务/流媒体/...）改为 url-test，在地区组之间自动择优；不测试 DIRECT/手动切换/节点选择。
 * 6. lazy=true：未被实际使用的 url-test 组不主动测速。
 */

function main(config) {
  const TEST_URL = "https://www.gstatic.com/generate_204";
  const INTERVAL = 1800; // 30 分钟
  const TOLERANCE = 100;
  const TIMEOUT = 5000;

  // 控制组必须保留 select，否则“手动切换”会失去实际流量入口。
  const KEEP_SELECT = new Set(["节点选择", "手动切换", "GLOBAL"]);

  // 这些组由规则直接引用；覆写后在地区组之间做 URLTest。
  const SERVICE_GROUPS = new Set([
    "AI服务",
    "流媒体",
    "游戏平台",
    "Google服务",
    "社交媒体",
    "Microsoft服务",
    "Apple服务",
  ]);

  // 明确标注 >1x 的节点不进入自动测速。
  // 允许：1x、1.0x、未标倍率
  // 排除：1.1x、1.5x、2x、2.5x、3x、5x、2倍、5倍消耗等
  const HIGH_RATE = String.raw`(?:1\.(?:0*[1-9]\d*)|(?:[2-9]\d*)(?:\.\d+)?)\s*(?:x|倍)`;

  const groups = Array.isArray(config["proxy-groups"])
    ? config["proxy-groups"]
    : [];

  const existingNames = new Set(groups.map((g) => g && g.name).filter(Boolean));

  function stripCasePrefix(pattern) {
    return String(pattern || "").replace(/^\(\?i\)/, "");
  }

  function appendHighRateExclude(group) {
    const oldPattern = stripCasePrefix(group["exclude-filter"]);
    group["exclude-filter"] = oldPattern
      ? `(?i)(?:${oldPattern})|(?:${HIGH_RATE})`
      : `(?i)(?:${HIGH_RATE})`;
  }

  function enableUrlTest(group) {
    group.type = "url-test";
    group.url = TEST_URL;
    group.interval = INTERVAL;
    group.lazy = true;
    group.tolerance = TOLERANCE;
    group.timeout = TIMEOUT;
    group["expected-status"] = 204;

    // select 专用字段对 url-test 无意义。
    delete group["default-selected"];
  }

  for (const group of groups) {
    if (!group || !group.name || KEEP_SELECT.has(group.name)) continue;

    const directNodeGroup =
      group["include-all-proxies"] === true ||
      typeof group.filter === "string" ||
      typeof group["exclude-filter"] === "string";

    if (directNodeGroup) {
      // 地区组 / 其他节点：直接对原始节点 URLTest，并排除高倍率。
      appendHighRateExclude(group);
      enableUrlTest(group);
      continue;
    }

    if (SERVICE_GROUPS.has(group.name) && Array.isArray(group.proxies)) {
      // 服务组：只保留有效地区组作为候选。
      // 去掉 DIRECT，避免 DIRECT 永远因延迟最低而获胜；
      // 去掉 节点选择/手动切换，避免自动路径重新绕回高倍率手动节点。
      group.proxies = group.proxies.filter(
        (name) =>
          name !== "DIRECT" &&
          name !== "节点选择" &&
          name !== "手动切换" &&
          existingNames.has(name)
      );

      if (group.proxies.length > 0) enableUrlTest(group);
    }
  }

  config["proxy-groups"] = groups;
  return config;
}
