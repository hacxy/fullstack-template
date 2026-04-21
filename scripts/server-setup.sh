#!/usr/bin/env bash
# 首次部署前在服务器上手动执行此脚本（需要 sudo 权限）
# 用法: bash server-setup.sh [deploy_user] [deploy_pubkey]
# 示例: bash server-setup.sh deploy "ssh-ed25519 AAAA... github-actions"

set -euo pipefail

DEPLOY_USER="${1:-deploy}"
DEPLOY_PUBKEY="${2:-}"
APP_USER="myapp"
APP_DIR="/opt/myapp"
SERVICE_NAME="myapp-server"

echo "==> 创建应用运行用户 ($APP_USER)..."
if ! id "$APP_USER" &>/dev/null; then
  useradd -r -s /bin/false -d "$APP_DIR" "$APP_USER"
  echo "    用户 $APP_USER 已创建"
else
  echo "    用户 $APP_USER 已存在，跳过"
fi

echo "==> 创建目录结构..."
mkdir -p "$APP_DIR/server/bin"
mkdir -p "$APP_DIR/server/prisma/migrations"
mkdir -p "$APP_DIR/web"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
echo "    目录结构已创建：$APP_DIR"

echo "==> 配置 SSH 部署用户 ($DEPLOY_USER)..."
if ! id "$DEPLOY_USER" &>/dev/null; then
  useradd -m -s /bin/bash "$DEPLOY_USER"
  echo "    用户 $DEPLOY_USER 已创建"
fi
if [ -n "$DEPLOY_PUBKEY" ]; then
  DEPLOY_HOME=$(eval echo "~$DEPLOY_USER")
  mkdir -p "$DEPLOY_HOME/.ssh"
  echo "$DEPLOY_PUBKEY" >> "$DEPLOY_HOME/.ssh/authorized_keys"
  chmod 700 "$DEPLOY_HOME/.ssh"
  chmod 600 "$DEPLOY_HOME/.ssh/authorized_keys"
  chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_HOME/.ssh"
  echo "    公钥已添加到 $DEPLOY_HOME/.ssh/authorized_keys"
fi

echo "==> 配置 sudo 权限（允许 $DEPLOY_USER 无密码管理服务）..."
SUDOERS_FILE="/etc/sudoers.d/myapp-deploy"
cat > "$SUDOERS_FILE" << EOF
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/systemctl start $SERVICE_NAME, /bin/systemctl stop $SERVICE_NAME, /bin/systemctl status $SERVICE_NAME
EOF
chmod 440 "$SUDOERS_FILE"
echo "    sudoers 配置已写入 $SUDOERS_FILE"

echo "==> 允许 $DEPLOY_USER 写入应用目录..."
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR"
# 运行时 APP_USER 需要写 prisma 目录（sqlite.db）
chown -R "$APP_USER:$APP_USER" "$APP_DIR/server/prisma"
chmod g+w "$APP_DIR/server/prisma"
# 允许 DEPLOY_USER 写入 prisma（迁移时需要）
usermod -aG "$APP_USER" "$DEPLOY_USER" 2>/dev/null || true

echo "==> 创建 systemd service 文件..."
cat > "/etc/systemd/system/${SERVICE_NAME}.service" << EOF
[Unit]
Description=MyApp Backend Server (Elysia)
After=network.target

[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR/server
ExecStart=$APP_DIR/server/bin/server
Environment=NODE_ENV=production
Environment=PORT=3000
Restart=on-failure
RestartSec=5s
StartLimitIntervalSec=60s
StartLimitBurst=3
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$APP_DIR/server/prisma
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$SERVICE_NAME

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
echo "    systemd service 已注册并设置为开机启动"

echo ""
echo "==> 初始化完成！"
echo ""
echo "下一步操作："
echo "  1. 将 Nginx 配置复制到服务器：scripts/nginx-myapp.conf → /etc/nginx/sites-available/myapp"
echo "  2. 执行：sudo ln -s /etc/nginx/sites-available/myapp /etc/nginx/sites-enabled/"
echo "  3. 执行：sudo nginx -t && sudo systemctl reload nginx"
echo "  4. 在 GitHub 仓库 Settings > Secrets 中配置："
echo "       SERVER_HOST = 服务器 IP 或域名"
echo "       SERVER_USER = $DEPLOY_USER"
echo "       SSH_PRIVATE_KEY = 对应私钥内容"
echo "  5. 推送 prod_ 前缀 tag 触发部署：git tag prod_v1.0.0 && git push origin prod_v1.0.0"
