/**
 * 清理 Free 聚合配置中的异常 Hysteria 节点。
 *
 * 外部函数：无。
 *
 * 输入参数：
 * - config：Object，Sub-Store 生成的完整 Mihomo 配置；`proxies` 应为代理对象数组。
 *
 * 输出参数：
 * - Promise<Object>，返回原配置对象。Hysteria2 的空速率字段会被删除；Hysteria v1
 *   会优先从 `up-speed/down-speed` 回填 `up/down`，无法修复的节点会被过滤。
 *
 * 调用示例：
 * `await main({ proxies: [{ type: "hysteria", server: "example.com", up: "10", down: "50" }] })`
 */
async function main(config) {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return config;
  }

  const proxies = Array.isArray(config.proxies) ? config.proxies : [];

  const isBlank = (value) =>
    value === null || value === undefined || String(value).trim() === "";

  config.proxies = proxies.filter((proxy) => {
    if (!proxy || typeof proxy !== "object" || Array.isArray(proxy)) {
      return false;
    }

    const type = String(proxy.type || "").toLowerCase();

    // Hysteria2 允许省略速率，删除空字段即可。
    if (type === "hysteria2") {
      for (const key of ["up", "down", "up-speed", "down-speed"]) {
        if (isBlank(proxy[key])) {
          delete proxy[key];
        }
      }

      return true;
    }

    if (type === "hysteria") {
      if (isBlank(proxy.up) && !isBlank(proxy["up-speed"])) {
        proxy.up = proxy["up-speed"];
      }

      if (isBlank(proxy.down) && !isBlank(proxy["down-speed"])) {
        proxy.down = proxy["down-speed"];
      }

      const invalidSpeed = isBlank(proxy.up) || isBlank(proxy.down);
      const invalidServer =
        isBlank(proxy.server) ||
        String(proxy.server).trim().startsWith("@");

      if (invalidSpeed || invalidServer) {
        return false;
      }
    }

    return true;
  });

  return config;
}
