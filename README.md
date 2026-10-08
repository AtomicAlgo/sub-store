


# Sub-Store 配置脚本备份

本仓库保存个人使用的 Sub-Store YAML 模板和后处理脚本。仓库只管理可公开复用的配置逻辑，不保存订阅原文、生成后的节点列表或任何访问凭据。

## 目录与内容管理

| 路径 | 内容 | 是否提交 |
| --- | --- | --- |
| `scripts/yaml/All/` | 完整分流模板的历史版本 | 是 |
| `scripts/yaml/Free/` | Free 场景模板 | 是 |
| `scripts/yaml/Mine/` | Mine 场景模板 | 是 |
| `scripts/js/` | Sub-Store 后处理脚本 | 是 |
| `tests/` | 本地兼容性测试 | 是 |
| `subscribe/` | 原始订阅和最终生成配置，含密码、UUID、token | 否，仅本地保存 |
| `.agentdocs/` | AI 代理使用的工程治理文档 | 是 |

新增功能时不要覆盖旧版文件，应创建递增版本并更新本页。订阅文件统一放入 `subscribe/`；即使仓库设置为私有，也不得强制加入 Git。

## YAML 版本说明

### All

| 版本 | 功能说明 |
| --- | --- |
| `v1.0.1` | 最小配置：提供手动选择、自动测速和统一代理入口，包含本地地址直连及最终代理规则。 |
| `v1.0.2` | 增加香港、台湾、日本、新加坡、美国地区分组，并扩充常用直连与代理规则。 |
| `v1.0.3` | 切换为中文分组体系；加入更多地区、AI、流媒体、游戏、Google、社交、Microsoft、Apple 等服务组，引入远程规则集和完整规则优先级。 |
| `v1.0.4` | 调整地区顺序和匹配策略，新增“其他节点”，强化手动切换及服务分组结构。 |
| `v1.0.5` | 精简独立地区组，将低频地区归入“其他节点”，保留 19 个核心分组并简化配置。 |
| `v1.0.6` | 在 `v1.0.5` 基础上增加 GitHub 及 Docker Hub、GHCR、LSCR 等容器镜像域名规则。当前推荐版本。 |

`v1.0.3` 至 `v1.0.6` 已移除 Mihomo 不再支持的顶层 `global-client-fingerprint`。

### Free 与 Mine

| 版本 | 功能说明 |
| --- | --- |
| `Free/v1.0.1` | 19 个核心分组的精简规则模板，适合不区分订阅来源的组合配置。 |
| `Mine/v1.0.1` | 当前与 `Free/v1.0.1` 功能等价，仅保留了来源备注；后续个人专用策略应从该目录继续递增版本。 |

以上两个模板也已移除废弃的顶层客户端指纹字段。

## JavaScript 版本说明

| 文件 | 功能说明 |
| --- | --- |
| `URLTest1.js` | 当前较完整的二次覆写：保留“节点选择”“手动切换”“GLOBAL”为手动组；地区组与服务组启用 URLTest，并排除高倍率节点。 |
| `URLTest2.js` | 激进自动模式：除“手动切换”外将现有组转换为 URLTest，并移除自动候选中的 `DIRECT` 和手动组。 |
| `URLTest3.js` | 保守自动模式：只把指定地区组转换为 URLTest，其他服务组继续保持手动选择；切换容差为 150 ms。 |
| `ClientFingerprint.js` | FlClash/Mihomo 兼容处理：删除旧的全局指纹字段，并给适用的 TLS 代理补充逐代理 `client-fingerprint: chrome`。 |

## FlClash 指纹报错处理

新版 Mihomo 已删除：

```yaml
global-client-fingerprint: chrome
```

在 Sub-Store 的最终配置处理链中加入 `scripts/js/ClientFingerprint.js`，并确保它在生成代理列表之后执行。脚本会把配置调整为逐代理形式：

```yaml
proxies:
  - name: example
    type: trojan
    client-fingerprint: chrome
```

更新处理链后重新生成分享文件，再在 FlClash 中更新或重新导入订阅。只删除模板顶层字段并不能修复旧的已生成分享文件，必须重新生成。

## 本地验证

```powershell
node --check scripts/js/ClientFingerprint.js
node tests/client-fingerprint.test.js
rg "^global-client-fingerprint:" scripts/yaml
git ls-files subscribe
```

最后两条命令都应无输出。创建远程仓库时选择 Private，且不要在 GitHub 页面自动生成 README、`.gitignore` 或 License；随后按页面提示添加远程并推送当前分支。
