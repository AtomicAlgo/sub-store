


# Sub-Store 配置脚本备份

本仓库保存个人使用的 Sub-Store YAML 模板和后处理脚本。仓库只管理可公开复用的配置逻辑，不保存订阅原文、生成后的节点列表或任何访问凭据。

## 目录与内容管理

| 路径 | 内容 | 是否提交 |
| --- | --- | --- |
| `scripts/yaml/All/` | 完整分流模板的历史版本 | 是 |
| `scripts/yaml/Free/` | Free 场景模板 | 是 |
| `scripts/yaml/Mine/` | Mine 场景模板 | 是 |
| `scripts/yaml/Config/` | 可切换的 DNS/TUN 配置层，不包含代理组和规则 | 是 |
| `scripts/js/` | Sub-Store 后处理脚本 | 是 |
| `tests/` | 本地兼容性测试 | 是 |
| `subscribe/` | 原始订阅和最终生成配置，含密码、UUID、token | 否，仅本地保存 |
| `.agentdocs/` | AI 代理使用的工程治理文档 | 是 |

新增功能优先使用描述功能的稳定脚本名，通过 Git commit/tag 和下方版本说明追踪历史；已归档的旧版模板保留。订阅文件统一放入 `subscribe/`；即使仓库设置为私有，也不得强制加入 Git。

## Windows TUN 与 DNS 分流配置

新增 `Config/v1.2.0.yaml`，与 `All/v1.0.10` 配套。国内域名复用 `U_CN_DOMAIN` 规则集，使用国内直连 DoH；其他域名默认通过“节点选择”访问国外 DoH；`U_AI`、`U_GFW` 和 Google 中国域名例外优先走代理 DNS。节点引导使用独立国内 DoH。采用 redir-host、1500 MTU、UDP/TCP DNS 接管和 Windows 严格路由。

Sub-Store 文件操作按以下顺序启用：

1. `scripts/yaml/All/v1.0.10.yaml`，保留代理组与分流规则。
2. `scripts/yaml/Config/v1.2.0.yaml`，统一 DNS/TUN。
3. `scripts/js/All/add_chained_proxy.js`，最后补充链式代理。

禁用旧 `Config/v1.0.0` 和 `Config/v1.1.0` 操作。不要同时启用多个 Config 层。更新后的“节点选择”须指向有效代理链路；该组或其地区子组选择 DIRECT、空组回落 DIRECT 时，国外 DoH 也会直连。

FlClash 清理当前 DNS 覆写字段列表，保留“追加系统 DNS”关闭；清理当前 `strict-route=false` 的 TUN 覆写，确保最终生成值与新 Config 相同。界面保留本地控制端口与 TUN 开关管理，订阅内 DNS/TUN 参数以新配置层为准。以最终生成文件和核心运行态复核，界面字段名称可能随版本变化。

本机此前严格路由与网络接口切换出现过故障，配置解析通过仅证明静态有效。正式验收还需检查 TUN 启停、换网、DNS 物理出口及长时间 CPU/端口占用。应用自带 DoH、局域网私有域名、Tailscale 和 WSL 独立解析器需要单独核查。该配置不包含路由器或 Windows ICS 的系统设置修改。

## YAML 版本说明

### All

| 版本 | 功能说明 |
| --- | --- |
| `v1.0.1` | 最小配置：提供手动选择、自动测速和统一代理入口，包含本地地址直连及最终代理规则。 |
| `v1.0.2` | 增加香港、台湾、日本、新加坡、美国地区分组，并扩充常用直连与代理规则。 |
| `v1.0.3` | 切换为中文分组体系；加入更多地区、AI、流媒体、游戏、Google、社交、Microsoft、Apple 等服务组，引入远程规则集和完整规则优先级。 |
| `v1.0.4` | 调整地区顺序和匹配策略，新增“其他节点”，强化手动切换及服务分组结构。 |
| `v1.0.5` | 精简独立地区组，将低频地区归入“其他节点”，保留 19 个核心分组并简化配置。 |
| `v1.0.6` | 在 `v1.0.5` 基础上增加 GitHub 及 Docker Hub、GHCR、LSCR 等容器镜像域名规则。 |
| `v1.0.7` | 新增地区内自动切换：八个明确地区各自提供 `fallback` 故障切换、`url-test` 自动择优和手动选择，默认使用本地区故障切换；自动组排除高倍率节点，“其他节点”保持手动，不启用负载均衡或跨地区自动跳转。 |
| `v1.0.8` | 精简地区分组显示：隐藏各地区内部的 `fallback` 和 `url-test` 工作组，地区入口直接并列两个自动模式与本地区原始节点；移除独立的地区手动组。面向日常软路由，`fallback` 每 60 秒检查可用性，`url-test` 每 300 秒比较延迟。 |
| `v1.0.9` | 在 `v1.0.8` 基础上增加 `DMIT前置选择` 组，并配套 `scripts/js/All/v1.0.9.js` 复制 LA2 住宅节点、注入 `dialer-proxy`。链式副本保留“美国”名称以进入美国分区，原 LA2 保留作对照。DMIT 已不可用，作为历史实验版本保留。 |
| `v1.0.10` | 3x-ui订阅驱动的通用链式方案：上游提供名称含“链式”的落地节点。原JS按完整节点名生成 `<节点名>-前置选择`；现由稳定文件名 `add_chained_proxy.js` 接续，清理来源/国旗显示、移除旧组并把前置组排在GLOBAL末尾。 |

`All/v1.0.3` 至 `All/v1.0.6` 均已移除 Mihomo 不再支持的顶层 `global-client-fingerprint`。

### Config

| 版本 | 功能说明 |
| --- | --- |
| `Config/v1.0.0` | `redir-host` 日常推荐配置层，只包含加密 DNS 与 TUN；所有域名返回真实 IP。 |
| `Config/v1.2.0` | Windows TUN 与显式 DNS 分流配置层，配套 All/v1.0.10；加载顺序和验收边界见上节。 |
| `Config/v1.1.0` | 有限 Fake-IP 兼容备份层，只对 `geosite:gfw` 返回 Fake-IP，其余域名返回真实 IP。 |

旧 Config/v1.0.0 与 Config/v1.1.0 都要求 FlClash 保持 TUN 开启，并关闭会替换订阅 `dns:` 内容的 DNS 覆写。`strict-route` 可能影响部分虚拟机或局域网软件；遇到异常时应先临时关闭该字段定位。

### Free 与 Mine

| 版本 | 功能说明 |
| --- | --- |
| `Free/v1.0.1` | 19 个核心分组的精简规则模板，适合不区分订阅来源的组合配置。 |
| `Mine/v1.0.1` | 与 `Free/v1.0.1` 功能等价的个人配置基线。 |

All、Free、Mine 只负责代理组和规则，使用时三选一；DNS/TUN 由 Config 单独叠加。所有正式模板均已移除废弃的顶层客户端指纹字段。

## Sub-Store 叠加方式

组合订阅 `all` 只负责生成、过滤和重命名节点，不要把 YAML 内容添加到组合订阅的节点操作中。

在“文件 -> Mihomo 配置”中创建文件，来源选择组合订阅 `all`，然后添加两个 YAML 操作：

1. 选择一个代理规则层：日常稳定版使用 `All/v1.0.8`；测试不依赖 DMIT 的 nxCG住宅链式时使用 `All/v1.0.10`；`v1.0.9` 仅作为旧 DMIT 实验记录保留；Free/Mine 场景可继续使用各自的 `v1.0.1`。
2. 选择一个 DNS/TUN 层：日常使用 `Config/v1.0.0`，兼容回退使用 `Config/v1.1.0`。

推荐组合：

```text
all-redir-host
  代理规则层：All/v1.0.8
  DNS/TUN 层：Config/v1.0.0

all-fake-ip
  代理规则层：All/v1.0.8
  DNS/TUN 层：Config/v1.1.0
```

切换 DNS 模式时只需禁用当前 Config 操作并启用另一个 Config 操作，不需要复制或修改代理组规则。两个配置层的顶层键互不冲突，最终文件应只出现一个 `dns:`、一个 `tun:` 和一个 `proxy-groups:`。

`All/v1.0.8` 的顶层“节点选择”只负责手动选择地区。香港、台湾、日本、狮城、美国、韩国、英国和澳洲均默认进入隐藏的本地区 `fallback`，并可在地区入口内切换到隐藏的本地区 `url-test` 或直接选择本地区原始节点；自动组不会跨地区跳转，并排除明确标记的高倍率节点，地区入口中的原始节点则保留高倍率。面向日常软路由，`fallback` 使用 `interval: 60` 尽快发现故障，`url-test` 使用 `interval: 300` 和 `tolerance: 100` 稳定比较延迟；两者均使用 `timeout: 5000`、`lazy: false`。由于“其他节点”包含多个国家，它只保留手动选择；模板不启用负载均衡。客户端是否隐藏内部工作组取决于其界面是否支持 Mihomo 的 `hidden` 字段。

### 通用客户端链式（add_chained_proxy）

在节点、规则、DNS/TUN均生成后，最后执行 `scripts/js/All/add_chained_proxy.js`。不再使用带序号的 `v1.0.10.js` 文件名；脚本不保存任何节点凭据。

| 阶段 | 功能与变化 |
| --- | --- |
| 历史 `v1.0.9.js` | 识别并复制固定DMIT LA2入口，生成住宅链式副本；保留为历史实验，不推荐继续部署。 |
| 历史 `archive/v1.0.10.js` | 识别任何名称含“链式”的上游节点，生成 `<完整节点名>-前置选择`；不再硬编码目标和凭据。 |
| 当前 `add_chained_proxy.js` | 保持节点名原样；去掉组标题中的 `[MINE]` 等来源标签、国旗和前导分隔符，生成 `前置代理:美国-住宅链式-01`；移除历史住宅/DMIT前置组；清理旧引用；前置组追加至组列表及显式GLOBAL候选末尾。 |

例如节点 `[MINE]🇺🇸|美国-住宅链式-01` 不被重命名，其 `dialer-proxy` 指向 `前置代理:美国-住宅链式-01`。国家文字保留，用来区分不同落地；只移除来源标签和旗帜。没有显式GLOBAL时由Mihomo生成；客户端UI可能有自己的排列偏好，应以最终配置和 `/proxies/GLOBAL` 验证。

前置候选使用本次订阅中明确的原始节点列表，排除所有链式节点、已有dialer-proxy的节点和流量提示节点。没有候选时使用REJECT，不自动转DIRECT。脚本可重复运行，名称清理造成冲突时以后缀区分。切换或更新组名后，旧前置选择不会自动继承，请重新选择需要的入口。

最终链路为 `选定前置 → nxCG落地`。更新订阅后先选前置，再在国家/服务组中选择原链式节点。端口、域名和认证参数完全来自上游3x-ui；不得把旧39443端口或旧DMIT方案写死。Mihomo所需的 `support-x25519mlkem768` 字段原样保留。

测试：`node tests/add-chained-proxy.test.js`。测试覆盖名称、GLOBAL末尾顺序、旧组清理、重名、无前置时拒绝、幂等性和凭据保留。

### 历史 DMIT LA2 链式（All/v1.0.9）

`v1.0.9` 必须同时使用代理规则层和后处理脚本，单独叠加 YAML 不会创建链式代理：

1. 代理规则层选择 `All/v1.0.9.yaml`。
2. 在代理列表生成后执行 `scripts/js/All/v1.0.9.js`。这是 Sub-Store 的文件后处理脚本，不是 FlClash 覆写脚本。
3. 不要把 `tests/dmit-la2-chain-v1.0.9.test.js` 粘贴到 Sub-Store；测试文件使用 Node 的 `require` 和 `__dirname`，快捷脚本沙箱不提供这些变量。
4. 在客户端的 `DMIT前置选择` 中选择一个原始节点。
5. 在美国分区中选择 `[MINE]美国LA2-住宅链式2x`。

纯 YAML 只能定义 `DMIT前置选择` 策略组；由于 LA2 来自动态订阅，YAML 不能复制该代理对象并给副本注入 `dialer-proxy`。如果直接修改原 LA2 而不保留副本，可以人工把完整 LA2 凭据写进 YAML，但会重复敏感配置且订阅凭据变化后失效，因此不采用。

前置组允许来自任意国家的原始节点，包括 `[MINE]` 节点，但排除名称含“链式”的节点和自身，避免直接递归。选择其他 `[MINE]` 节点作为前置时仍需自行确认它不依赖目标 LA2，否则可能形成间接循环。脚本兼容当前 `[MINE]家宽2x-美国LA2-1` 和旧名 `[MINE]美国LA2-住宅2x`，并核对 `algowiki.586037.xyz:443` 与 `/nxcg-chain-7f42c9/`。原 LA2 不会被修改。

运行验收要求链式出口为 `38.134.116.93`，Mihomo `/connections` 同时出现链式 LA2 和所选前置；前置或 LA2 后端故障时必须直接失败。当前仅完成配置结构和 Mihomo 加载验证：测试时 DMIT `179.253.245.180:443` 从 Cudy 直连已超时，原 LA2 也无法建立，因此不能据此宣称链式出口验收通过。

## JavaScript 版本说明

| 文件 | 功能说明 |
| --- | --- |
| `js/All/add_chained_proxy.js` | 当前通用链式后处理；功能名固定、版本用Git tag管理，详见上面的阶段说明。 |
| `URLTest1.js` | 当前较完整的二次覆写：保留“节点选择”“手动切换”“GLOBAL”为手动组；地区组与服务组启用 URLTest，并排除高倍率节点。 |
| `URLTest2.js` | 激进自动模式：除“手动切换”外将现有组转换为 URLTest，并移除自动候选中的 `DIRECT` 和手动组。 |
| `URLTest3.js` | 保守自动模式：只把指定地区组转换为 URLTest，其他服务组继续保持手动选择；切换容差为 150 ms。 |
| `ClientFingerprint.js` | FlClash/Mihomo 兼容处理：删除旧的全局指纹字段，并给适用的 TLS 代理补充逐代理 `client-fingerprint: chrome`。 |
| `js/Free/v1.0.1.js` | Free 系列第一版 Hysteria 节点清理脚本，作为历史版本保留。 |
| `js/Free/v1.0.2.js` | 当前推荐版本：在第一版过滤逻辑上增加空配置和畸形代理项保护，保留 Hysteria2，并修复或过滤 Hysteria v1。 |

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

## StudyWiki 静态站部署试点

`deploy/studywiki/` 保存GC2的Hugo PaperMod站点源码、固定构建版本说明与Nginx安全部署脚本。页面内容与代理凭据隔离，构建产物和日志留在服务器 `/data`，不提交API路径或私钥。部署/自建Reality目标验收见该目录的README。

## 本地验证

```powershell
node --check scripts/js/ClientFingerprint.js
node --check scripts/js/Free/v1.0.1.js
node --check scripts/js/Free/v1.0.2.js
node tests/client-fingerprint.test.js
node tests/dns-variants.test.js
node tests/free-hysteria-filter.test.js
rg "^global-client-fingerprint:" scripts/yaml
git ls-files subscribe
```

最后两条命令都应无输出。创建远程仓库时选择 Private，且不要在 GitHub 页面自动生成 README、`.gitignore` 或 License；随后按页面提示添加远程并推送当前分支。
