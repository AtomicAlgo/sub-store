# 工程文档索引

## 项目治理

`project/governance.md` - 仓库内容边界、敏感文件规则、版本发布与本地验证要求；修改版本文件或准备提交时必读。

## 已完成任务文档

`workflow/done/261008-secure-initial-repository.md` - 清除旧提交历史、保护订阅数据并修复 FlClash 指纹配置兼容问题。
`workflow/done/261008-add-dns-mode-variants.md` - 已被 Config 分层方案取代的完整 DNS 版本历史记录。
`workflow/done/261008-sync-free-mine-dns-variants.md` - 已被 Config 分层方案取代的 Free/Mine 重复同步历史记录。
`workflow/done/261008-split-dns-and-proxy-layers.md` - 当前采用的 DNS/TUN 与代理组规则分层方案。
`workflow/done/261008-add-free-hysteria-filter.md` - Free 系列损坏 Hysteria 节点过滤脚本及验证。

## 全局重要记忆

- `subscribe/` 中的订阅文件包含真实节点凭据，只允许保存在本地，禁止加入 Git。
- Mihomo 已移除顶层 `global-client-fingerprint`；最终配置应通过 Sub-Store 脚本给代理设置 `client-fingerprint`。
- 发布新版本时保留旧版本，新版本使用递增文件名，并同步更新根目录 `README.md`。
