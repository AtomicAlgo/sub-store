# 新增 DNS 模式版本

> 状态：该完整配置方案已被 `Config/v1.0.0` 与 `Config/v1.1.0` 分层方案取代。All 中的 `v1.2.0`、`v1.3.0` 已删除，以下内容仅记录历史决策。

## 背景

现有 `All/v1.0.6.yaml` 不包含 `dns:` 和 `tun:`，最终 DNS 模式由 FlClash 覆写决定。当前订阅普遍使用全局 Fake-IP，导致 WSL 中出现 DNS 已获得 `198.18.0.0/16` 假地址、后续连接却未进入 TUN 的失败场景。

## 版本决策

- `v1.2.0.yaml`：基于 `v1.0.6` 的 redir-host 推荐版本，所有域名返回真实解析地址。
- `v1.3.0.yaml`：基于 `v1.0.6` 的有限 Fake-IP 兼容备份版本，仅对 `geosite:gfw` 使用 Fake-IP，其他域名返回真实地址。
- 两个版本均移除 `system://`、测试性质的内网策略和对外监听 DNS 端口，并补齐 Windows/WSL 所需的 TUN 路由字段。

## 实施阶段

- [x] 审计本地订阅的 DNS/TUN 配置并识别风险。
- [x] 从 `v1.0.6.yaml` 创建 `v1.2.0.yaml` 与 `v1.3.0.yaml`。
- [x] 写入各自 DNS 模式及共同 TUN 配置。
- [x] 更新 README 版本说明和使用约束。
- [x] 新增单元及集成检查。
- [x] 执行语法、差异、安全和 Git 状态验证。
- [x] 归档任务文档。

## 验收结果

- 两个新版本从 `proxy-groups:` 开始均与 `v1.0.6` 完全一致。
- `v1.2.0` 只使用 `redir-host`，不存在任何 Fake-IP 专用字段。
- `v1.3.0` 使用 `fake-ip-filter-mode: rule`，顺序为 `GEOSITE,gfw,fake-ip` 后接 `MATCH,real-ip`。
- 两个版本均只有一个 `dns:` 和一个 `tun:`，且不含 `system://`、`global-client-fingerprint` 或 Tab 字符。
- `subscribe/`、根目录可执行文件和 `fakeip配置.png` 已由 `.gitignore` 排除，未进入 Git。
