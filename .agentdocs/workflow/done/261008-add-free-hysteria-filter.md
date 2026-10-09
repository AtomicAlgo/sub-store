# 新增 Free Hysteria 节点过滤器

## 背景

Free 聚合节点中存在损坏的 Hysteria v1：缺少必要上传/下载速率，服务器地址以 `@` 开头。Mihomo 会拒绝此类节点，单纯删除空 `up/down` 会破坏 Hysteria v1 的必填语义，但 Hysteria2 允许省略这些字段。

## 实施阶段

- [x] 保留 `scripts/js/Free/v1.0.1.js` 第一版，并新增带输入保护的 `v1.0.2.js` 推荐版本。
- [x] 清理 Hysteria2 空速率字段并保留节点。
- [x] 为 Hysteria v1 从 `up-speed/down-speed` 回填 `up/down`。
- [x] 过滤缺少必要速率或服务器地址损坏的 Hysteria v1 节点。
- [x] 补充单元与集成测试。
- [x] 更新 README 功能记录和项目治理说明。
- [x] 执行语法、安全、格式和 Git 状态验证。
- [x] 归档任务文档。

## 验收结果

- Hysteria2 的空速率字段被删除，节点仍被保留。
- 可修复的 Hysteria v1 完成速率回填并保留。
- 缺少必要速率或服务器地址为空、以 `@` 开头的 Hysteria v1 被过滤。
- 其他协议节点及已有有效字段不受影响。
- 脚本包含输入输出、功能、外部函数和调用示例说明。
