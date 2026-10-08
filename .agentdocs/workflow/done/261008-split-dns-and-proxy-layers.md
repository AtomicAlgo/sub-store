# 拆分 DNS 与代理规则配置层

## 背景

此前在 All、Free、Mine 中分别生成包含 DNS、TUN、代理组和规则的完整版本，造成相同 DNS 配置重复维护。Sub-Store 的 Mihomo 文件配置支持叠加 YAML 操作，因此将 DNS/TUN 独立为 Config 层，All、Free、Mine 只负责不同的 `proxy-groups`、`rule-providers` 和 `rules`。

## 最终结构

- `Config/v1.0.0.yaml`：只包含 redir-host `dns:` 和公共 `tun:`。
- `Config/v1.1.0.yaml`：只包含有限 Fake-IP `dns:` 和公共 `tun:`。
- All、Free、Mine 不包含 DNS/TUN，继续作为代理组和规则配置系列。

## 实施阶段

- [x] 检查 Config 目录和待迁移版本状态。
- [x] 删除 6 个放置错误的组合版本及空占位文件。
- [x] 创建两个纯 DNS/TUN Config 版本。
- [x] 重写 README 的目录、版本与 Sub-Store 叠加说明。
- [x] 更新已被新决策取代的历史任务文档。
- [x] 重写测试以验证配置层边界和切换语义。
- [x] 执行 YAML 解析、结构、安全及 Git 状态验证。
- [x] 归档任务文档。

## 验收结果

- Config 两个文件的顶层键只有 `dns` 和 `tun`。
- Config 文件不包含代理组、路由规则、节点或凭据。
- `v1.0.0` 只使用 redir-host；`v1.1.0` 使用有限 Fake-IP rule 模式。
- All、Free、Mine 不再包含 `v1.2.0` 和 `v1.3.0`。
- 任意 Config 层与任意 All/Free/Mine 层叠加后不存在重复顶层键。
