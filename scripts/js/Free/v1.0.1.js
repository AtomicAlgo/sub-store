// v1.0.1.js 脚本无法修复
// 问题已经精确定位：proxy 816 是从 0 开始编号，对应 YAML 中第 817 个节点：
// [1]🇩🇪 江江德国 04 2
// 它是第一代 hysteria，不仅缺少 up/down，而且服务器地址以 @ 开头、认证字段为空，基本是一个损坏的订阅节点。第一代 Hysteria 要求配置上传和下载速率；Hysteria2 则允许不设置。Mihomo Hysteria 配置
// 因此不能简单删除所有协议的空 up/down，应直接过滤损坏的 Hysteria v1 节点。
/**
 * 第一版 Free Hysteria 异常节点过滤脚本。
 *
 * 外部函数：无。
 *
 * 输入参数：
 * - config：Object，包含 `proxies` 代理对象数组的完整 Mihomo 配置。
 *
 * 输出参数：
 * - Promise<Object>，返回原配置对象；清理 Hysteria2 空速率字段，并过滤无法修复的 Hysteria v1。
 *
 * 调用示例：
 * `await main({ proxies: [{ type: "hysteria", server: "example.com", up: "10", down: "50" }] })`
 */
async function main(config) {
  const proxies = Array.isArray(config.proxies)
    ? config.proxies
    : [];

  const isBlank = value => {
    return (
      value === null ||
      value === undefined ||
      String(value).trim() === ""
    );
  };

  config.proxies = proxies.filter(proxy => {
    const type = String(proxy.type || "").toLowerCase();

    /*
     * Hysteria2：
     * up/down 可以不设置
     * 如果字段为空字符串，直接删除字段
     */
    if (type === "hysteria2") {
      ["up", "down", "up-speed", "down-speed"].forEach(key => {
        if (isBlank(proxy[key])) {
          delete proxy[key];
        }
      });

      return true;
    }

    /*
     * Hysteria v1：
     * 优先使用 up-speed/down-speed 补充 up/down
     */
    if (type === "hysteria") {
      if (isBlank(proxy.up) && !isBlank(proxy["up-speed"])) {
        proxy.up = proxy["up-speed"];
      }

      if (isBlank(proxy.down) && !isBlank(proxy["down-speed"])) {
        proxy.down = proxy["down-speed"];
      }

      const invalidSpeed =
        isBlank(proxy.up) ||
        isBlank(proxy.down);

      const invalidServer =
        isBlank(proxy.server) ||
        String(proxy.server).trim().startsWith("@");

      /*
       * 缺少必要速率或服务器地址损坏时，
       * 直接丢弃该节点
       */
      if (invalidSpeed || invalidServer) {
        return false;
      }
    }

    return true;
  });

  return config;
}
