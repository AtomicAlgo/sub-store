# 统一 TUN 与 DNS 配置层

## 目标与边界

- 新增 Config/v1.2.0，与 All/v1.0.10 和最后执行的 add_chained_proxy.js 配套。
- 国内域名国内加密 DNS，国外域名代理加密 DNS，允许独立引导解析。
- 保留旧版本；用户自行在 Sub-Store 加载，本任务不修改运行中客户端或远端服务。
- 节点选择含 DIRECT 且地区空组可能回落 DIRECT，用户必须选择有效代理链路。应用自带 DoH、私有域名和系统旁路仍需出口验收。

## 分阶段计划

- [x] 核对现有分层、规则集名称与客户端覆盖冲突。
- [x] 创建独立配置层，显式定义 DNS 出口和 Windows DNS 接管。
- [x] 单元及合并集成验证，校验 YAML 与核心配置兼容性。
- [x] 更新使用入口和清理覆盖说明，归档任务。
- 实机 TUN 压力、换网及物理出口抓包由加载后另行验收，本任务不声明完成。

## 验证记录

- node --check tests/unified-tun-dns.test.js 通过。
- unified-tun-dns、dns-variants、add-chained-proxy、nxcg-direct-chain-v1.0.10 测试均通过。
- 临时目录 PyYAML 解析新配置并合并 All/v1.0.10，规则集类型和引用检查通过。
- 独立官方 Mihomo v1.19.33 使用本地地理数据、合成 SOCKS 节点执行 -t 通过。FlClashCore 是客户端专用 IPC 程序，无法直接用标准 -t，故使用同版本独立核心校验。
- 配置交付阶段未发布至 GitHub、未操作远端 Sub-Store；后续用户已加载配置。客户端直接写入尝试被自动审批拒绝，界面操作被用户停止。
- 后续只读复核确认 TUN 与严格路由已开启、FlClash 网卡正常；国内外域名的 TUN UDP/TCP 四次查询及三次 Windows 系统解析均成功。短时 DNS Client CPU 接近零，最近15分钟未查到4227/4231。
- 客户端仍保留覆写名单和系统其他接口DNS。物理出口防泄露、换网和长期稳定性尚未验收。
