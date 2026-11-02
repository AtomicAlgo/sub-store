# StudyWiki PaperMod / GC2 试点

## 可复现构建

- 站点：https://studywiki.586037.xyz/
- Hugo：0.158.0 extended，官方发布包对照该版本checksums文件验证。
- PaperMod：https://github.com/adityatelange/hugo-PaperMod
- 固定提交：`118119693d8b5ac211b939775678310973bcb232`。
- 当前页面：主页、关于、文章列表、阅读笔记、每周复盘、标签、RSS、sitemap、robots。
- 无数据库、评论、用户注册或第三方统计。不要把后台地址、订阅或密钥放进页面。

服务器源文件 `/data/www/studywiki`，构建工具 `/data/tools/hugo-0.158.0/hugo`，产物 `/data/www/studywiki/releases/20261102-final`，线上symlink `/data/www/studywiki/current`。

```bash
# 在工作副本中执行；themes和public不提交。
git clone https://github.com/adityatelange/hugo-PaperMod.git themes/PaperMod
git -C themes/PaperMod checkout 118119693d8b5ac211b939775678310973bcb232
hugo --minify --destination /path/to/new-release
# 验证新release后再原子切换current symlink。
```

主题当前提交需要Hugo >=0.158.0；Ubuntu提供的0.154.5会构建失败，不要忽略版本警告。

## 443与自建Reality目标

最终路径：公网443 Nginx stream → 本机9443 Xray Reality。

- 普通HTTPS/管理API：Reality握手回落到 `127.0.0.1:8443`，由Nginx TLS站点提供页面和管理反代。
- 合法Reality客户端：通过同一公网443，SNI为 `studywiki.586037.xyz`，进入Xray代理。
- Reality `target=127.0.0.1:8443`、`xver=1`；Nginx后端8443监听带`proxy_protocol`，避免指回公网443造成循环。
- 外层stream `proxy_protocol on`；Xray TCP入站需同时接受PROXY protocol。真实来源经Xray xver=1继续传给HTTPS后端。
- TLS后端只信任127.0.0.1传来的PROXY protocol，不信任任意客户端X-Real-IP。
- `sniffing.routeOnly=true`保持不变，避免链式前置改写第二跳目标。
- 3x-ui管理API仍只监听127.0.0.1:12053；随机路径从现有配置读取，不提交仓库。

`install-nginx.py`是从先前分流基线安装安全站点的脚本：运行前阅读现网配置并备份，不能盲目用于其他服务器。它不修改3x-ui数据库。Reality设置通过官方API变更，并在切换前保存完整入站响应。最终stream域名映射需指向9443，配合上面的自建目标设置。

GC2 SNI发生变化后必须更新客户端订阅，旧缓存节点不能据此判断新配置不可用。日本GC4仍用原Reality目标。

## 安全与资源

- HTTPS公开证书和原ACME续期逻辑保留，80只用于ACME及跳转。
- 隐藏文件和常见扫描路径返回404；静态站无PHP执行入口。
- 站点请求20次/秒、突发60；登录路径1次/秒、突发5。集中管理API不受登录限速影响。
- fail2ban `studywiki-scan`：600秒内5次敏感扫描，封禁80/443一小时；保留SSH jail。中央管理机与回环地址为受控白名单。
- access/error日志放 `/data/www/studywiki/logs`；每日或超过10MiB轮转，保留7份压缩档，每小时检查一次。不是每个文件绝对10MiB硬限额，检查间隔内可临时超出。
- 日志记录真实来源，包含请求路径；只供维护读取，勿提交原始日志。

测试用文档保留地址验证了nftables封禁和解除；fail2ban-regex匹配三条敏感路径，未匹配正常文章/API请求。没有使用真实管理来源做封禁试验。

## 实机验收（2026-11-02）

- 首次构建：0.154.5不兼容，未切换线上；固定0.158.0后22页成功。
- HTTPS：首页、文章列表、两篇文章、RSS/sitemap/robots 200；关于页本机一次TLS EOF后源站复测200。
- `/.env`、`/.git/config`、`/wp-login.php`返回404。
- 中央面板GC2节点online、Xray running；日本与nxCG未被网站改动替换。
- 已从3x-ui导出新SNI，以Mihomo验证GC2 IPv4/IPv6分别为同机地址。双IP来自服务器双栈，不是节点组自动切换的证据。
- 从Sub-Store刷新mine源并生成all最终文件，GLOBAL候选末尾和组列表末尾均为`前置代理:美国-住宅链式-01`，无旧`住宅前置选择`。
- 使用新GC2 SNI作为Mihomo前置 → nxCG，实测出口38.134.116.93；经该链访问StudyWiki首页为200。
- GC4经代理IPv4/IPv6实测分别185.222.43.28 / 2a12:a304:4:d8d::a；GC2分别96.9.213.248 / 2a11:8083:11:188c:2f1:38ff:fee8:a6f0。保留双栈，未擅自禁用IPv6。

## 回滚

Nginx备份在 `/data/www/studywiki/backups/`；官方API备份和切换前入站响应保存在操作环境的受限目录。回滚必须同时恢复Reality目标/SNI/xver/PROXY协议开关与Nginx stream/TLS监听设置，不能只回滚其中一半。

网站内容可单独切回旧current symlink；它不需要重启Xray。主题更新应在新release目录构建，验证后再切换。
