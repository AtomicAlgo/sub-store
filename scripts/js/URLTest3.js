function main(config) {
  const groups = config["proxy-groups"];

  if (!Array.isArray(groups)) {
    return config;
  }

  // ==========================================================
  // URL-Test 参数
  // ==========================================================

  const TEST_URL = "https://www.gstatic.com/generate_204";

  // 30 分钟
  const INTERVAL = 1800;

  // 切换容差，单位 ms
  const TOLERANCE = 150;

  // 测速超时
  const TIMEOUT = 5000;


  // ==========================================================
  // 只有这些“节点地区组”才自动测速
  // ==========================================================

  const AUTO_TEST_GROUPS = new Set([
    "香港节点",
    "台湾节点",
    "日本节点",
    "狮城节点",
    "美国节点",
    "韩国节点",
    "英国节点",
    "澳洲节点",
    "其他节点"
  ]);


  // ==========================================================
  // 高倍率过滤
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
  // [HIGH]
  //
  // 保留：
  // 1x
  // 1.0x
  // 无倍率
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


  // ==========================================================
  // 只修改地区节点组
  // ==========================================================

  for (const group of groups) {

    // 不是自动测速地区组
    // 完全不碰它
    //
    // 因此：
    // 节点选择
    // AI服务
    // Google服务
    // 流媒体
    // 手动切换
    // GLOBAL
    // ...
    // 都继续保持 select
    //
    if (!AUTO_TEST_GROUPS.has(group.name)) {
      continue;
    }


    // ========================================================
    // 地区组：
    //
    // select
    //   ↓
    // url-test
    // ========================================================

    group.type = "url-test";

    group.url = TEST_URL;
    group.interval = INTERVAL;

    // true:
    // 只有真正使用该组时才进行健康检查
    group.lazy = true;

    group.tolerance = TOLERANCE;
    group.timeout = TIMEOUT;

    group["expected-status"] = 204;


    // url-test 不需要默认手工选择
    delete group["default-selected"];


    // ========================================================
    // 自动测速地区组排除高倍率节点
    // ========================================================

    group["exclude-filter"] =
      addExclude(group["exclude-filter"]);
  }


  return config;
}