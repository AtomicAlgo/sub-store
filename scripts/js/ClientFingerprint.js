/**
 * 将旧版全局 TLS 客户端指纹迁移为 Mihomo 支持的逐代理配置。
 *
 * 外部函数：无。
 *
 * 输入参数：
 * - config：Object，Sub-Store 生成的完整 Mihomo 配置；`proxies` 应为代理对象数组。
 *
 * 输出参数：
 * - Object，原配置对象。函数会删除顶层 `global-client-fingerprint`，并为适用且未显式
 *   配置指纹的代理添加 `client-fingerprint: chrome`。
 *
 * 调用示例：
 * `main({ "global-client-fingerprint": "chrome", proxies: [{ type: "trojan" }] })`
 */
function main(config) {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return config;
  }

  delete config["global-client-fingerprint"];

  if (!Array.isArray(config.proxies)) {
    return config;
  }

  const alwaysTlsTypes = new Set([
    "anytls",
    "hysteria",
    "hysteria2",
    "trojan",
    "tuic",
  ]);

  for (const proxy of config.proxies) {
    if (!proxy || typeof proxy !== "object" || Array.isArray(proxy)) {
      continue;
    }

    const type = String(proxy.type || "").toLowerCase();
    const usesTls =
      alwaysTlsTypes.has(type) ||
      ((type === "vless" || type === "vmess") && proxy.tls === true);

    if (usesTls && !proxy["client-fingerprint"]) {
      proxy["client-fingerprint"] = "chrome";
    }
  }

  return config;
}
