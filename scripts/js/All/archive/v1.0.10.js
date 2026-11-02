/**
 * 为订阅中名称包含“链式”的落地节点生成独立前置选择组。
 *
 * 链式节点及其账号参数由 3x-ui/上游订阅提供；本脚本不保存服务器、UUID、
 * 密码或 Reality 参数。每个链式节点会得到一个可见的“<节点名>-前置选择”组，
 * 并自动写入 dialer-proxy。所有链式节点均从前置候选中排除，避免递归。
 */
function main(config) {
  if (!config || typeof config !== "object" || !Array.isArray(config.proxies)) {
    return config;
  }

  const groups = Array.isArray(config["proxy-groups"])
    ? config["proxy-groups"]
    : [];
  const chainProxies = config.proxies.filter(
    (proxy) => proxy && typeof proxy.name === "string" && proxy.name.includes("链式")
  );

  const generatedNames = new Set();
  for (const proxy of chainProxies) {
    const groupName = `${proxy.name}-前置选择`;
    generatedNames.add(groupName);
    proxy["dialer-proxy"] = groupName;

    const group = {
      name: groupName,
      type: "select",
      "include-all-proxies": true,
      "exclude-filter":
        "(?i)(链式|前置选择|剩余|流量|套餐|到期|重置|官网|Traffic|Expire|Expired|Reset|Quota)",
    };

    const index = groups.findIndex((item) => item && item.name === groupName);
    if (index >= 0) {
      groups[index] = group;
    } else {
      groups.push(group);
    }
  }

  config["proxy-groups"] = groups.filter((group) => {
    if (!group || typeof group.name !== "string") return true;
    if (!group.name.endsWith("-前置选择")) return true;
    return generatedNames.has(group.name);
  });

  return config;
}
