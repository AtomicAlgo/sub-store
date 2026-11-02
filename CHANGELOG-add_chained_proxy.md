# add_chained_proxy 发布说明

## add_chained_proxy-v1.0.0（2026-11-02）

- 正式脚本改用功能名 `scripts/js/All/add_chained_proxy.js`；旧v1.0.10实现移至archive目录，不再作为线上操作。
- 节点原名保持不变；前置组标题移除来源标签、国旗、前导分隔符，采用`前置代理:<国家-类型-编号>`。
- 组列表尾部追加前置组；显式GLOBAL的候选末尾追加相同组。
- 删除旧`住宅前置选择`、`DMIT前置选择`和`*-前置选择`组，清理引用及默认选项。
- 前置仅取无dialer-proxy的普通节点；没有安全候选则REJECT，避免递归与无意DIRECT回退。
- 幂等处理多落地节点及显示名冲突，保留认证、SNI、混合密钥选项和节点顺序。
- 线上Sub-Store all文件通过官方PATCH更新，保留其他操作；更新前wholeFile响应备份留在服务器root目录。
- GC2部署Hugo 0.158.0 + 固定PaperMod提交，studywiki为正常静态站及本机Reality目标；验证HTTPS、代理、API和CG链式。
- 双IP排查确认两台服务器双栈出站，未因改名而发生IPv4/IPv6出口切换，也未改为IPv4-only。

## 历史行为

| 阶段 | 行为 | 使用建议 |
| --- | --- | --- |
| v1.0.9 | 根据固定DMIT LA2源复制链式节点，依赖DMIT与特定WS路径。 | 历史实验；不作为当前推荐入口。 |
| v1.0.10 | 按名称“链式”发现落地，生成完整名称加`-前置选择`。 | 归档于`archive/v1.0.10.js`，可对照回归。 |
| add_chained_proxy | 通用逻辑不变，清理组名、旧组引用和GLOBAL顺序，明确无候选时拒绝。 | 当前正式入口；文件名固定，Git tag管理发布。 |

## 验证

- `node --check scripts/js/All/add_chained_proxy.js`
- `node tests/add-chained-proxy.test.js`
- `node tests/nxcg-direct-chain-v1.0.10.test.js`（历史实现回归）
- 线上all输出：新组存在且位于GLOBAL末尾，节点dialer-proxy同步更新，旧住宅组消失。
- 新GC2前置到nxCG出口为CG IPv4；HTTPS站点通过链路访问200。

## 升级与回滚

客户端更新最终Sub-Store订阅后，重新选择新前置组里的入口。原`[MINE]...-前置选择`保存的选择不保证自动迁移。

脚本回滚：将archive旧实现重新放回Sub-Store最后一个脚本操作，并恢复升级前wholeFile备份。网站和Reality回滚必须成对恢复SNI/target/PROXY协议设置及Nginx映射，详见`deploy/studywiki/README.md`。
