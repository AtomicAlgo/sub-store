# 项目治理

## 内容边界

- `scripts/yaml/`：可提交的 Mihomo 配置模板，按用途和版本保存。
- `scripts/js/`：可提交的 Sub-Store 后处理脚本，必须保持单一职责。
- `tests/`：不引入额外测试框架的本地验证脚本。
- `subscribe/`：本地订阅输入与生成结果，包含密码、UUID、token 等敏感信息，禁止提交。

## 版本管理

- 已发布版本不直接覆盖；功能变化应创建下一个版本文件。
- 兼容性修复可同步修正所有仍保留的模板，但必须在 `README.md` 记录影响范围。
- 新版本需要说明用途、相对上一版本的变化和配套后处理脚本。

## 安全要求

- 提交前执行 `git status --short` 和 `git ls-files subscribe`，后者必须无输出。
- 不在文档、测试或示例中记录真实订阅 URL、访问 token、节点密码、UUID、私钥或证书。
- 即使仓库为私有仓库，也按凭据可能外泄处理；已经进入 Git 历史的凭据应清除历史并视情况轮换。

## 验证要求

- JavaScript 变更执行 `node --check <文件>` 和 `node tests/client-fingerprint.test.js`。
- YAML 变更至少验证模板顶层不存在 `global-client-fingerprint`，并检查缩进和关键顶层结构。
- 新增或变更功能必须同步补充单元与集成场景；当前项目使用 Node 内置 `assert`，不引入测试框架。
