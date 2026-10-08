# 同步 Free 与 Mine DNS 版本

> 状态：该重复同步方案已被独立 Config 配置层取代。Free、Mine 中的 `v1.2.0`、`v1.3.0` 已删除，以下内容仅记录历史决策。

## 背景

All 系列已经基于 `v1.0.6` 建立 `v1.2.0` redir-host 主版本和 `v1.3.0` 有限 Fake-IP 备份版本。Free 与 Mine 仍停留在 `v1.0.1`，需要在保持各自代理组和规则主体不变的前提下同步 DNS/TUN 能力。

## 实施阶段

- [x] 核对 Free 与 Mine 最新基线及差异。
- [x] 分别创建 Free/Mine 的 `v1.2.0.yaml` 和 `v1.3.0.yaml`。
- [x] 同步经过验证的 DNS/TUN 配置。
- [x] 更新 README 版本说明。
- [x] 扩展跨系列单元与集成检查。
- [x] 执行 YAML 解析、差异、安全及 Git 状态验证。
- [x] 归档任务文档。

## 验收结果

- Free 与 Mine 均包含 `v1.2.0` redir-host 和 `v1.3.0` 有限 Fake-IP 版本。
- 每个新版本从 `proxy-groups:` 开始与同系列 `v1.0.1` 完全一致。
- 三个系列相同版本的 DNS/TUN 语义一致。
- 所有受管理版本无 Tab、无 BOM、无 `system://` 和 `global-client-fingerprint`。
- 用户未跟踪的 `scripts/yaml/All/temp.yaml` 未参与修改和版本测试。
