/**
 * add_chained_proxy — Sub-Store Mihomo 文件后处理（最后执行）。
 * 从上游名称包含“链式”的节点创建“前置代理:<显示名>”手动组。
 * 保留节点名称/凭据；只清理组标题中的来源标签、国旗和前导分隔符。
 * 不硬编码服务器；无安全前置时使用 REJECT，禁止自动回落 DIRECT。
 * 历史行为与发布说明见 README.md。版本由 Git tag 管理，不写入文件名。
 */
function main(config) {
  if (!config || typeof config !== "object" || !Array.isArray(config.proxies)) {
    return config;
  }

  const proxies = config.proxies.filter((p) => p && typeof p.name === "string");
  const chains = proxies.filter((p) => p.name.includes("链式"));
  const groups = Array.isArray(config["proxy-groups"]) ? config["proxy-groups"] : [];
  const PREFIX = "前置代理:";
  const legacyNames = new Set(["住宅前置选择", "DMIT前置选择"]);
  const isGenerated = (name) => typeof name === "string" &&
    (name.startsWith(PREFIX) || name.endsWith("-前置选择") || legacyNames.has(name));
  const retained = groups.filter((g) => g && !isGenerated(g.name));
  const occupied = new Set([...proxies.map((p) => p.name), ...retained.map((g) => g.name)]);
  const redirects = new Map();
  const generated = [];
  const candidates = proxies
    .filter((p) => !p.name.includes("链式") && !p["dialer-proxy"] &&
      !/(前置选择|前置代理:|剩余|流量|套餐|到期|重置|官网|Traffic|Expire|Reset|Quota)/i.test(p.name))
    .map((p) => p.name);

  function displayName(name) {
    return name
      .replace(/^(?:\s*\[[^\]]+\])+\s*/, "")
      .replace(/[\u{1F1E6}-\u{1F1FF}\uFE0F]/gu, "")
      .replace(/^[\s|｜·•:：-]+/, "")
      .trim();
  }

  for (const proxy of chains) {
    const base = PREFIX + (displayName(proxy.name) || "链式节点");
    let name = base;
    // Different subscription sources can have the same visible node title.
    for (let suffix = 2; occupied.has(name); suffix++) name = `${base} (${suffix})`;
    occupied.add(name);
    redirects.set(`${proxy.name}-前置选择`, name);
    if (isGenerated(proxy["dialer-proxy"])) redirects.set(proxy["dialer-proxy"], name);
    proxy["dialer-proxy"] = name;
    generated.push({
      name,
      type: "select",
      proxies: candidates.length ? [...new Set(candidates)] : ["REJECT"],
    });
  }

  function rewriteReferences(items) {
    return [...new Set(items.flatMap((item) => {
      if (redirects.has(item)) return [redirects.get(item)];
      return isGenerated(item) ? [] : [item];
    }))];
  }
  for (const group of retained) {
    if (Array.isArray(group.proxies)) {
      group.proxies = rewriteReferences(group.proxies);
      // A previously explicit group must not become an accidental DIRECT fallback.
      if (!group.proxies.length && !group["include-all-proxies"] && !group.use) {
        group.proxies = ["REJECT"];
      }
    }
    const selected = group["default-selected"];
    if (redirects.has(selected)) group["default-selected"] = redirects.get(selected);
    else if (isGenerated(selected)) delete group["default-selected"];
  }
  const global = retained.find((g) => g.name === "GLOBAL");
  if (global) {
    global.proxies = [...(global.proxies || []).filter((n) => !isGenerated(n)),
      ...generated.map((g) => g.name)];
  }
  // If GLOBAL is created by Mihomo, it inherits the group order below.
  config["proxy-groups"] = [...retained, ...generated];
  return config;
}
