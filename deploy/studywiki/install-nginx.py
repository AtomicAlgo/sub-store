#!/usr/bin/env python3
"""Install GC2 website routing/security after backing up the existing Nginx config.
Requires the Xray TCP inbound to accept PROXY protocol. Never embeds panel secrets.
"""
from pathlib import Path
import re, shutil, time

stamp = time.strftime('%Y%m%d-%H%M%S')
backup = Path('/data/www/studywiki/backups') / stamp
backup.mkdir(parents=True, mode=0o700)
main = Path('/etc/nginx/nginx.conf')
site = Path('/etc/nginx/sites-enabled/xui-node.conf')
shutil.copy2(main, backup/'nginx.conf')
shutil.copy2(site, backup/'xui-node.conf')
s = site.read_text()
base = re.search(r'location (/[a-f0-9]+/) \{', s).group(1)
s = s.replace('listen 127.0.0.1:8443 ssl;', 'listen 127.0.0.1:8443 ssl proxy_protocol;')
s = s.replace('root /var/www/xui-node;', '''root /data/www/studywiki/current;
 server_tokens off;
 real_ip_header proxy_protocol;
 set_real_ip_from 127.0.0.1;
 access_log /data/www/studywiki/logs/access.log studywiki;
 error_log /data/www/studywiki/logs/error.log warn;
 add_header X-Content-Type-Options nosniff always;
 add_header Referrer-Policy strict-origin-when-cross-origin always;
 add_header X-Frame-Options SAMEORIGIN always;
 add_header Strict-Transport-Security "max-age=86400" always;''')
s = s.replace(' proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;', ' proxy_set_header X-Forwarded-For $remote_addr;\n  proxy_set_header X-Real-IP $remote_addr;')
# Login-specific limit does not throttle node-sync heartbeat/API batches.
login = f''' location = {base}login {{
  limit_req zone=studywiki_login burst=5 nodelay;
  proxy_pass http://127.0.0.1:12053;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $remote_addr;
  proxy_set_header X-Forwarded-Proto https;
 }}
 location ~ /\\.(?!well-known/) {{ return 404; }}
 location ~* ^/(?:wp-admin|wp-login\\.php|xmlrpc\\.php|phpmyadmin|cgi-bin)(?:/|$) {{ return 404; }}
 location ~* \\.(?:php|sql|bak|env)$ {{ return 404; }}
 error_page 404 /404.html;
'''
s = s.replace(' location / { try_files $uri $uri/ =404; }', login + ''' location / {
  limit_req zone=studywiki_site burst=60 nodelay;
  limit_req_status 429;
  try_files $uri $uri/ =404;
 }''')
site.write_text(s)
s = main.read_text()
s = s.replace('server_tokens build;', 'server_tokens off;')
s = s.replace('ssl_preread on; proxy_pass $xui_backend;', 'ssl_preread on; proxy_protocol on; proxy_pass $xui_backend;')
assert 'proxy_protocol on;' in s, 'stream block did not match; restore backup'
main.write_text(s)
Path('/etc/nginx/conf.d/studywiki-security.conf').write_text('''log_format studywiki '$remote_addr - $remote_user [$time_local] "$request" $status $body_bytes_sent "$http_user_agent"';
limit_req_zone $binary_remote_addr zone=studywiki_site:2m rate=20r/s;
limit_req_zone $binary_remote_addr zone=studywiki_login:1m rate=1r/s;
''')
logs = Path('/data/www/studywiki/logs'); logs.mkdir(exist_ok=True, mode=0o750)
Path('/etc/fail2ban/filter.d/studywiki-scan.conf').write_text(r'''[Definition]
failregex = ^<HOST> - \S+ \[[^\]]*\] "(?:GET|POST|HEAD|PUT) /(?:\.(?:git|env)|wp-login\.php|wp-admin|xmlrpc\.php|phpmyadmin|cgi-bin)[^" ]* HTTP/[^"]+" (?:400|403|404) \d+
ignoreregex =
''')
Path('/etc/fail2ban/jail.d/studywiki-scan.local').write_text('''[studywiki-scan]
enabled = true
filter = studywiki-scan
logpath = /data/www/studywiki/logs/access.log
backend = auto
port = 80,443
banaction = nftables-multiport
findtime = 600
maxretry = 5
bantime = 3600
ignoreip = 127.0.0.1/8 ::1 186.244.238.90
''')
Path('/etc/logrotate.d/studywiki').write_text('''/data/www/studywiki/logs/*.log {
 daily
 maxsize 10M
 rotate 7
 compress
 missingok
 notifempty
 create 0640 www-data adm
 sharedscripts
 postrotate
  /usr/sbin/nginx -s reopen >/dev/null 2>&1 || true
 endscript
}
''')
Path('/etc/systemd/system/studywiki-logrotate.service').write_text('''[Unit]
Description=Check StudyWiki log size
[Service]
Type=oneshot
ExecStart=/usr/sbin/logrotate -s /var/lib/logrotate/studywiki.status /etc/logrotate.d/studywiki
''')
Path('/etc/systemd/system/studywiki-logrotate.timer').write_text('''[Unit]
Description=Hourly StudyWiki log rotation check
[Timer]
OnCalendar=hourly
Persistent=true
[Install]
WantedBy=timers.target
''')
print('Backup:', backup)
