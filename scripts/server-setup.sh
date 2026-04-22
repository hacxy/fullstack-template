#!/usr/bin/env bash
# 首次部署前在服务器上手动执行此脚本（需要 sudo 权限）
# 用法（非交互）: bash server-setup.sh [deploy_user] [deploy_pubkey] [cors_origin]
# 用法（交互）  : bash server-setup.sh

set -euo pipefail

# ── 颜色 ──────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

step() { echo -e "\n${BLUE}${BOLD}==>${NC} $1"; }
ok()   { echo -e "    ${GREEN}✓${NC}  $1"; }
warn() { echo -e "    ${YELLOW}⚠${NC}   $1"; }
die()  { echo -e "\n${RED}错误：${NC}$1" >&2; exit 1; }

# ── 参数 / 交互式提示 ──────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}Fullstack Template — 服务器初始化${NC}"
echo "--------------------------------------"

DEPLOY_USER="${1:-}"
if [ -z "$DEPLOY_USER" ]; then
  read -r -p "部署用户名（GitHub Actions 用来 SSH 登录）[deploy]: " DEPLOY_USER
  DEPLOY_USER="${DEPLOY_USER:-deploy}"
fi

DEPLOY_PUBKEY="${2:-}"
if [ -z "$DEPLOY_PUBKEY" ]; then
  echo "请粘贴部署用户的 SSH 公钥（留空则跳过，稍后可手动添加）："
  read -r DEPLOY_PUBKEY
fi

CORS_ORIGIN="${3:-}"
if [ -z "$CORS_ORIGIN" ]; then
  read -r -p "生产环境 CORS 来源，即前端域名（如 https://example.com）[http://localhost:5173]: " CORS_ORIGIN
  CORS_ORIGIN="${CORS_ORIGIN:-http://localhost:5173}"
fi

APP_USER="myapp"
APP_DIR="/opt/myapp"
SERVICE_NAME="myapp-server"

echo ""
echo -e "  部署用户：${BOLD}$DEPLOY_USER${NC}"
echo -e "  CORS 来源：${BOLD}$CORS_ORIGIN${NC}"
echo ""
read -r -p "以上配置是否正确？继续请按 Enter，取消请按 Ctrl+C..."

# ── 运行时需要 root ────────────────────────────────────────────────────────────
if [ "$(id -u)" -ne 0 ]; then
  die "此脚本需要 sudo 权限，请使用 sudo bash $0"
fi

# ── 创建应用用户 ───────────────────────────────────────────────────────────────
step "创建应用运行用户 ($APP_USER)"
if ! id "$APP_USER" &>/dev/null; then
  useradd -r -s /bin/false -d "$APP_DIR" "$APP_USER"
  ok "用户 $APP_USER 已创建"
else
  ok "用户 $APP_USER 已存在，跳过"
fi

# ── 创建目录结构 ───────────────────────────────────────────────────────────────
step "创建目录结构"
mkdir -p "$APP_DIR/server/bin"
mkdir -p "$APP_DIR/server/drizzle"
mkdir -p "$APP_DIR/web"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
ok "目录结构已创建：$APP_DIR"

# ── 配置部署用户 ───────────────────────────────────────────────────────────────
step "配置 SSH 部署用户 ($DEPLOY_USER)"
if ! id "$DEPLOY_USER" &>/dev/null; then
  useradd -m -s /bin/bash "$DEPLOY_USER"
  ok "用户 $DEPLOY_USER 已创建"
else
  ok "用户 $DEPLOY_USER 已存在，跳过"
fi

if [ -n "$DEPLOY_PUBKEY" ]; then
  DEPLOY_HOME=$(eval echo "~$DEPLOY_USER")
  mkdir -p "$DEPLOY_HOME/.ssh"
  # 避免重复添加同一公钥
  if ! grep -qF "$DEPLOY_PUBKEY" "$DEPLOY_HOME/.ssh/authorized_keys" 2>/dev/null; then
    echo "$DEPLOY_PUBKEY" >> "$DEPLOY_HOME/.ssh/authorized_keys"
    ok "公钥已添加到 $DEPLOY_HOME/.ssh/authorized_keys"
  else
    ok "公钥已存在，跳过"
  fi
  chmod 700 "$DEPLOY_HOME/.ssh"
  chmod 600 "$DEPLOY_HOME/.ssh/authorized_keys"
  chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_HOME/.ssh"
else
  warn "未提供公钥，请稍后手动添加到 ~$DEPLOY_USER/.ssh/authorized_keys"
fi

# ── sudo 权限 ──────────────────────────────────────────────────────────────────
step "配置 sudo 权限（允许 $DEPLOY_USER 无密码管理服务）"
SUDOERS_FILE="/etc/sudoers.d/myapp-deploy"
cat > "$SUDOERS_FILE" << EOF
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/systemctl start $SERVICE_NAME, /bin/systemctl stop $SERVICE_NAME, /bin/systemctl status $SERVICE_NAME
EOF
chmod 440 "$SUDOERS_FILE"
ok "sudoers 配置已写入 $SUDOERS_FILE"

# ── 目录写权限 ────────────────────────────────────────────────────────────────
step "配置目录权限"
# 部署用户需要写入 server 目录（上传二进制和迁移文件）
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR"
# 运行时 APP_USER 需要读写 server 目录（sqlite.db、drizzle/）
chown -R "$APP_USER:$APP_USER" "$APP_DIR/server"
chmod g+s "$APP_DIR/server"
# 允许 DEPLOY_USER 写入 server 目录
usermod -aG "$APP_USER" "$DEPLOY_USER" 2>/dev/null || true
setfacl -R -m "u:$DEPLOY_USER:rwx" "$APP_DIR/server" 2>/dev/null \
  || chmod -R 775 "$APP_DIR/server"
ok "目录权限已配置"

# ── systemd service ────────────────────────────────────────────────────────────
step "创建 systemd service 文件"
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
Environment=DATABASE_URL=file:./sqlite.db
Environment=CORS_ORIGIN=$CORS_ORIGIN
Restart=on-failure
RestartSec=5s
StartLimitIntervalSec=60s
StartLimitBurst=3
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$APP_DIR/server
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$SERVICE_NAME

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
ok "systemd service 已注册并设置为开机启动"

# ── 完成 ───────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}初始化完成！${NC}"
echo ""
echo "下一步操作："
echo "  1. 将 Nginx 配置复制到服务器并修改 server_name："
echo "       sudo cp scripts/nginx-myapp.conf /etc/nginx/sites-available/myapp"
echo "       sudo ln -s /etc/nginx/sites-available/myapp /etc/nginx/sites-enabled/"
echo "       sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "  2. 在 GitHub 仓库 Settings > Secrets and variables > Actions 中添加："
echo "       SERVER_HOST    = 服务器 IP 或域名"
echo "       SERVER_USER    = $DEPLOY_USER"
echo "       SSH_PRIVATE_KEY = 对应私钥内容"
echo ""
echo "  3. 推送 prod_ 前缀 tag 触发部署："
echo "       git tag prod_v1.0.0 && git push origin prod_v1.0.0"
