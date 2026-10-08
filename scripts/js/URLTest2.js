// 这个脚本很短，因为 Mihomo 本身已经具备你需要的健康检查能力，我们没必要自己重新实现一套测速逻辑。url-test 会依据健康检查结果自动选择节点；tolerance 是切换容差
function main(config) {
  const groups = config["proxy-groups"];

  if (!Array.isArray(groups)) {
    return config;
  }

  const TEST_URL = "https://www.gstatic.com/generate_204";

  // 30 分钟
  const INTERVAL = 1800;

  // 切换容差
  const TOLERANCE = 100;

  // 超时
  const TIMEOUT = 5000;

  // ==========================================================
  // 自动测速时排除高倍率
  //
  // 排除：
  // 1.1x
  // 1.2x
  // 1.5x
  // 2x
  // 2.5x
  // 3x
  // 5x
  // 2倍
  // 5倍
  // 高倍率
  // HIGH
  //
  // 不排除：
  // 1x
  // 1.0x
  // 没写倍率的节点
  // ==========================================================

  const HIGH_RATE =
    String.raw`(?:1\.(?:0*[1-9]\d*)|(?:[2-9]|[1-9]\d+)(?:\.\d+)?)\s*(?:x|倍)|高倍率|\[HIGH\]`;

  function addExclude(original) {
    if (!original) {
      return `(?i)(${HIGH_RATE})`;
    }

    const base = String(original)
      .replace(/^\(\?i\)/, "");

    return `(?i)(?:${base})|(?:${HIGH_RATE})`;
  }

  for (const group of groups) {

    // ========================================================
    // 手动切换永远保持手工选择
    // 高倍率节点也只能从这里人工选
    // ========================================================

    if (group.name === "手动切换") {
      continue;
    }

    // ========================================================
    // 所有其他现有组：
    //
    // select
    //    ↓
    // url-test
    //
    // 名称不变
    // filter 不变
    // icon 不变
    // 节点来源不变
    // ========================================================

    group.type = "url-test";

    group.url = TEST_URL;
    group.interval = INTERVAL;
    group.lazy = true;
    group.tolerance = TOLERANCE;
    group.timeout = TIMEOUT;
    group["expected-status"] = 204;

    // url-test 不需要 default-selected
    delete group["default-selected"];

    // ========================================================
    // 地区组 / 其他节点
    //
    // 这些组直接 include-all-proxies
    // 因此直接在 exclude-filter 中排除高倍率
    // ========================================================

    if (
      group["include-all-proxies"] === true ||
      group.filter
    ) {
      group["exclude-filter"] =
        addExclude(group["exclude-filter"]);
    }

    // ========================================================
    // 节点选择 / AI / 流媒体等属于二级组
    //
    // 自动模式下：
    // 不允许通过 DIRECT 获得“最低延迟”
    // 也不允许 URLTest 自动进入 手动切换
    //
    // 否则 DIRECT 基本一定是最快的
    // ========================================================

    if (Array.isArray(group.proxies)) {
      group.proxies = group.proxies.filter(
        name =>
          name !== "DIRECT" &&
          name !== "手动切换"
      );
    }
  }

  return config;
}