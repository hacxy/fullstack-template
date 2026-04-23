#!/usr/bin/env bun
/**
 * First-time deployment initialization script.
 * Sets up the production server, nginx, systemd service, and SSH deploy keys.
 *
 * Usage:
 *   bun scripts/init-deploy.ts         (Mac/Linux)
 *   bun scripts\init-deploy.ts         (Windows)
 *
 * Requirements:
 *   - ssh, scp, ssh-keygen available locally (Windows 10+ includes OpenSSH)
 *   - Initial SSH user must be root or have passwordless sudo (NOPASSWD)
 */

import { createInterface } from 'node:readline'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Config {
  projectName: string
  appDir: string
  serverHost: string
  initUser: string
  initKeyPath: string
  deployUser: string
  configureNginx: boolean
  nginxConfName: string
  domain: string
  corsOrigin: string
  serverPort: number
  generateKey: boolean
  httpsMethod: 'none' | 'letsencrypt' | 'manual'
  httpsEmail?: string
  httpsCertPath?: string
  httpsKeyPath?: string
}

// ── Console helpers ───────────────────────────────────────────────────────────

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
}
const step = (msg: string) => console.log(`\n${c.blue}${c.bold}==>${c.reset} ${msg}`)
const ok = (msg: string) => console.log(`    ${c.green}✓${c.reset}  ${msg}`)
const warn = (msg: string) => console.log(`    ${c.yellow}⚠${c.reset}   ${msg}`)
const die = (msg: string): never => {
  console.error(`\n${c.red}错误：${c.reset}${msg}`)
  process.exit(1)
}

// ── Input helpers ─────────────────────────────────────────────────────────────

function createPrompt() {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return {
    ask: (question: string, defaultValue = ''): Promise<string> =>
      new Promise(resolve => {
        const display = defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `
        rl.question(display, answer => resolve(answer.trim() || defaultValue))
      }),
    askBool: (question: string, defaultYes = true): Promise<boolean> =>
      new Promise(resolve => {
        rl.question(`${question} [${defaultYes ? 'Y/n' : 'y/N'}]: `, answer => {
          const a = answer.trim().toLowerCase()
          resolve(a ? a === 'y' || a === 'yes' : defaultYes)
        })
      }),
    close: () => rl.close(),
  }
}

// ── SSH helpers ───────────────────────────────────────────────────────────────

function sshBaseArgs(config: Config): string[] {
  return [
    '-i', config.initKeyPath,
    '-o', 'StrictHostKeyChecking=accept-new',
    '-o', 'ConnectTimeout=10',
    '-o', 'BatchMode=yes',
    `${config.initUser}@${config.serverHost}`,
  ]
}

async function sshExec(config: Config, command: string): Promise<{ stdout: string; ok: boolean }> {
  const proc = Bun.spawn(['ssh', ...sshBaseArgs(config), command], {
    stdout: 'pipe',
    stderr: 'pipe',
  })
  const [stdout, code] = await Promise.all([
    new Response(proc.stdout).text(),
    proc.exited,
  ])
  return { stdout: stdout.trim(), ok: code === 0 }
}

async function sshRootScript(config: Config, script: string): Promise<void> {
  const rootCmd = config.initUser === 'root' ? ['bash', '-s'] : ['sudo', 'bash', '-s']
  const proc = Bun.spawn(['ssh', ...sshBaseArgs(config), ...rootCmd], {
    stdin: new Blob([script]),
    stdout: 'inherit',
    stderr: 'inherit',
  })
  const code = await proc.exited
  if (code !== 0) die(`远程脚本执行失败（exit code ${code}）`)
}

// 将文本内容通过 base64 安全写入远程文件（base64 字符集不含 shell 特殊字符）
function b64write(content: string, remotePath: string): string {
  const encoded = Buffer.from(content).toString('base64')
  return `echo '${encoded}' | base64 -d | tee '${remotePath}' > /dev/null`
}

// ── Config collection ─────────────────────────────────────────────────────────

async function collectConfig(): Promise<Config> {
  const p = createPrompt()

  console.log(`\n${c.bold}Fullstack Template — 首次部署初始化${c.reset}`)
  console.log('─'.repeat(42))

  const pkgPath = path.join(import.meta.dir, '..', 'package.json')
  let defaultProjectName = 'myapp'
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as { name?: string }
    if (pkg.name) defaultProjectName = pkg.name
  }
  catch { /* 读取失败则保留默认值 */ }

  const projectName = await p.ask('项目名称（服务名、目录名前缀）', defaultProjectName)
  const appDir = await p.ask('服务器部署根目录', `/opt/${projectName}`)

  let serverHost = ''
  while (!serverHost) {
    serverHost = await p.ask('服务器 IP 或域名（必填）')
    if (!serverHost) console.log(`  ${c.yellow}服务器地址不能为空${c.reset}`)
  }

  const defaultKeyPath = path.join(os.homedir(), '.ssh', 'id_rsa')
  const initUser = await p.ask('初始 SSH 用户（需 root 或 NOPASSWD sudo 权限）', 'root')
  const initKeyPath = await p.ask('本地 SSH 私钥路径（用于首次连接服务器）', defaultKeyPath)
  const deployUser = await p.ask('部署用户名（GitHub Actions 用）', 'deploy')

  const configureNginx = await p.askBool('由脚本自动生成并上传 Nginx 配置？（选 N 跳过，稍后自行配置）')
  let nginxConfName = ''
  let domain = serverHost
  let httpsMethod: Config['httpsMethod'] = 'none'
  let httpsEmail: string | undefined
  let httpsCertPath: string | undefined
  let httpsKeyPath: string | undefined

  if (configureNginx) {
    nginxConfName = await p.ask('Nginx 配置文件名', projectName)
    domain = await p.ask('域名或 IP（nginx server_name）', serverHost)
    const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(domain)
    if (!isIp) {
      const wantHttps = await p.askBool('配置 HTTPS？')
      if (wantHttps) {
        const method = await p.ask("证书方式 (1=Let's Encrypt  2=手动证书)", '1')
        if (method === '2') {
          httpsMethod = 'manual'
          httpsCertPath = await p.ask('证书文件路径（服务器上）', `/etc/ssl/certs/${domain}.pem`)
          httpsKeyPath = await p.ask('私钥文件路径（服务器上）', `/etc/ssl/private/${domain}.key`)
        }
        else {
          httpsMethod = 'letsencrypt'
          httpsEmail = await p.ask("Let's Encrypt 注册邮箱", `admin@${domain}`)
        }
      }
    }
  }

  const defaultProtocol = httpsMethod !== 'none' ? 'https' : 'http'
  const corsOrigin = await p.ask('CORS 来源（前端地址）', `${defaultProtocol}://${domain}`)
  const serverPort = Number(await p.ask('后端监听端口', '3000'))
  const generateKey = await p.askBool('生成部署专用 SSH 密钥对')
  p.close()

  const httpsLabel = httpsMethod === 'letsencrypt' ? "Let's Encrypt" : httpsMethod === 'manual' ? '手动证书' : '仅 HTTP'
  console.log('\n' + '─'.repeat(42))
  console.log(`  项目名称 : ${c.bold}${projectName}${c.reset}`)
  console.log(`  部署目录 : ${c.bold}${appDir}${c.reset}`)
  console.log(`  服务器   : ${c.bold}${serverHost}${c.reset}`)
  console.log(`  初始用户 : ${c.bold}${initUser}${c.reset}`)
  console.log(`  部署用户 : ${c.bold}${deployUser}${c.reset}`)
  if (configureNginx) {
    console.log(`  域名     : ${c.bold}${domain}${c.reset}`)
    console.log(`  HTTPS    : ${c.bold}${httpsLabel}${c.reset}`)
  }
  console.log(`  CORS     : ${c.bold}${corsOrigin}${c.reset}`)
  console.log(`  端口     : ${c.bold}${serverPort}${c.reset}`)
  console.log('─'.repeat(42))

  const confirm = createPrompt()
  await confirm.ask('\n以上配置是否正确？按 Enter 继续，Ctrl+C 取消')
  confirm.close()

  return {
    projectName,
    appDir,
    serverHost,
    initUser,
    initKeyPath,
    deployUser,
    configureNginx,
    nginxConfName,
    domain,
    corsOrigin,
    serverPort,
    generateKey,
    httpsMethod,
    httpsEmail,
    httpsCertPath,
    httpsKeyPath,
  }
}

// ── Server setup script ───────────────────────────────────────────────────────

function buildServerSetupScript(config: Config): string {
  const serviceName = `${config.projectName}-server`
  const appUser = config.projectName

  const serviceContent = `[Unit]
Description=${config.projectName} Backend Server
After=network.target

[Service]
Type=simple
User=${appUser}
Group=${appUser}
WorkingDirectory=${config.appDir}/server
ExecStart=${config.appDir}/server/bin/server
Environment=NODE_ENV=production
Environment=PORT=${config.serverPort}
Environment=DATABASE_URL=file:./sqlite.db
Environment=CORS_ORIGIN=${config.corsOrigin}
Restart=on-failure
RestartSec=5s
StartLimitIntervalSec=60s
StartLimitBurst=3
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=${config.appDir}/server
StandardOutput=journal
StandardError=journal
SyslogIdentifier=${serviceName}

[Install]
WantedBy=multi-user.target
`

  const sudoersContent = `${config.deployUser} ALL=(ALL) NOPASSWD: /usr/bin/systemctl start ${serviceName}, /usr/bin/systemctl stop ${serviceName}, /usr/bin/systemctl status ${serviceName} *\n`

  return `#!/usr/bin/env bash
set -euo pipefail

echo "==> [1/5] 创建应用运行用户 (${appUser})"
if ! id "${appUser}" &>/dev/null; then
  useradd -r -s /bin/false -d "${config.appDir}" "${appUser}"
fi

echo "==> [2/5] 创建目录结构"
mkdir -p "${config.appDir}/server/bin"
mkdir -p "${config.appDir}/web"
chown -R "${appUser}:${appUser}" "${config.appDir}"

echo "==> [3/5] 创建部署用户 (${config.deployUser})"
if ! id "${config.deployUser}" &>/dev/null; then
  useradd -m -s /bin/bash "${config.deployUser}"
fi
mkdir -p "/home/${config.deployUser}/.ssh"
chmod 700 "/home/${config.deployUser}/.ssh"
touch "/home/${config.deployUser}/.ssh/authorized_keys"
chmod 600 "/home/${config.deployUser}/.ssh/authorized_keys"
chown -R "${config.deployUser}:${config.deployUser}" "/home/${config.deployUser}/.ssh"

echo "==> [4/5] 配置 sudo 权限"
${b64write(sudoersContent, `/etc/sudoers.d/${serviceName}-deploy`)}
chmod 440 "/etc/sudoers.d/${serviceName}-deploy"

echo "==> [5/5] 注册 systemd 服务"
${b64write(serviceContent, `/etc/systemd/system/${serviceName}.service`)}
systemctl daemon-reload
systemctl enable "${serviceName}"

echo "==> 配置目录写权限"
chown -R "${config.deployUser}:${config.deployUser}" "${config.appDir}"
chown -R "${appUser}:${appUser}" "${config.appDir}/server"
chmod g+s "${config.appDir}/server"
setfacl -R -m "u:${config.deployUser}:rwx" "${config.appDir}/server" 2>/dev/null || chmod -R 775 "${config.appDir}/server"
`
}

// ── Nginx setup script ────────────────────────────────────────────────────────

function buildNginxScript(config: Config): string {
  const appBlock = `
    root ${config.appDir}/web;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:${config.serverPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 10s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /scalar {
        proxy_pass http://127.0.0.1:${config.serverPort};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    access_log /var/log/nginx/${config.nginxConfName}_access.log;
    error_log  /var/log/nginx/${config.nginxConfName}_error.log;`

  const nginxConf = config.httpsMethod === 'manual'
    ? `server {
    listen 80;
    server_name ${config.domain};
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name ${config.domain};

    ssl_certificate     ${config.httpsCertPath};
    ssl_certificate_key ${config.httpsKeyPath};
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
${appBlock}
}
`
    : `server {
    listen 80;
    server_name ${config.domain};
${appBlock}
}
`
  const encoded = Buffer.from(nginxConf).toString('base64')

  return `#!/usr/bin/env bash
set -euo pipefail

# 根据发行版选择 nginx 配置路径
if [ -f /etc/debian_version ] || grep -qiE 'debian|ubuntu' /etc/os-release 2>/dev/null; then
  mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
  CONF_PATH="/etc/nginx/sites-available/${config.nginxConfName}"
  USE_SYMLINK=1
else
  CONF_PATH="/etc/nginx/conf.d/${config.nginxConfName}.conf"
  USE_SYMLINK=0
fi

echo "==> [1/2] 写入 Nginx 配置 (\$CONF_PATH)"
echo '${encoded}' | base64 -d | tee "\$CONF_PATH" > /dev/null

if [ "\$USE_SYMLINK" = "1" ]; then
  ln -sf "\$CONF_PATH" "/etc/nginx/sites-enabled/${config.nginxConfName}"
fi

echo "==> [2/2] 测试并重载 Nginx"
nginx -t
systemctl reload nginx
`
}

// ── Let's Encrypt setup ───────────────────────────────────────────────────────

function buildLetsEncryptScript(config: Config): string {
  return `#!/usr/bin/env bash
set -euo pipefail

echo "==> [1/2] 安装 Certbot"
if ! command -v certbot &>/dev/null; then
  if command -v apt-get &>/dev/null; then
    apt-get update -qq && apt-get install -y certbot python3-certbot-nginx
  elif command -v dnf &>/dev/null; then
    dnf install -y certbot python3-certbot-nginx
  elif command -v yum &>/dev/null; then
    yum install -y epel-release && yum install -y certbot python3-certbot-nginx
  else
    echo "无法自动安装 certbot，请手动安装后重试" >&2; exit 1
  fi
fi

echo "==> [2/2] 申请证书并配置 HTTPS"
certbot --nginx -d '${config.domain}' --non-interactive --agree-tos -m '${config.httpsEmail}' --redirect
`
}

// ── Deploy key setup ──────────────────────────────────────────────────────────

async function setupDeployKey(config: Config): Promise<string> {
  const tmpDir = os.tmpdir()
  const keyFile = path.join(tmpDir, `deploy_key_${Date.now()}`)

  const keygen = Bun.spawn(
    ['ssh-keygen', '-t', 'ed25519', '-f', keyFile, '-N', '', '-C', `${config.deployUser}@${config.projectName}`],
    { stdout: 'pipe', stderr: 'pipe' },
  )
  if (await keygen.exited !== 0) die('SSH 密钥生成失败，请确认 ssh-keygen 已安装')

  const privateKey = fs.readFileSync(keyFile, 'utf-8')
  const publicKey = fs.readFileSync(`${keyFile}.pub`, 'utf-8').trim()

  fs.unlinkSync(keyFile)
  fs.unlinkSync(`${keyFile}.pub`)

  const uploadScript = `#!/usr/bin/env bash
set -euo pipefail
DEPLOY_HOME=$(eval echo ~${config.deployUser})
mkdir -p "\$DEPLOY_HOME/.ssh"
if ! grep -qF "${publicKey}" "\$DEPLOY_HOME/.ssh/authorized_keys" 2>/dev/null; then
  echo "${publicKey}" >> "\$DEPLOY_HOME/.ssh/authorized_keys"
fi
chmod 700 "\$DEPLOY_HOME/.ssh"
chmod 600 "\$DEPLOY_HOME/.ssh/authorized_keys"
chown -R "${config.deployUser}:${config.deployUser}" "\$DEPLOY_HOME/.ssh"
`
  await sshRootScript(config, uploadScript)
  ok('部署公钥已上传到服务器')
  return privateKey
}

// ── Update deploy.yml ─────────────────────────────────────────────────────────

function updateDeployYml(config: Config): void {
  const deployYmlPath = path.join(import.meta.dir, '..', '.github', 'workflows', 'deploy.yml')
  if (!fs.existsSync(deployYmlPath)) {
    warn('未找到 .github/workflows/deploy.yml，跳过更新')
    return
  }
  let content = fs.readFileSync(deployYmlPath, 'utf-8')
  content = content.replaceAll('/opt/myapp', config.appDir)
  content = content.replaceAll('myapp-server', `${config.projectName}-server`)
  fs.writeFileSync(deployYmlPath, content)
  ok('deploy.yml 已更新')
}

// ── Summary ───────────────────────────────────────────────────────────────────

function printSummary(config: Config, privateKey?: string): void {
  console.log(`\n${c.green}${c.bold}${'═'.repeat(44)}${c.reset}`)
  console.log(`${c.green}${c.bold}  部署初始化完成！${c.reset}`)
  console.log(`${c.green}${c.bold}${'═'.repeat(44)}${c.reset}\n`)

  console.log('请在 GitHub 仓库 Settings > Secrets and variables > Actions 中添加：\n')
  const apiUrl = config.configureNginx
    ? (config.httpsMethod !== 'none' ? `https://${config.domain}` : `http://${config.domain}`)
    : `http://${config.serverHost}`
  console.log(`  SERVER_HOST      = ${c.bold}${config.serverHost}${c.reset}`)
  console.log(`  SERVER_USER      = ${c.bold}${config.deployUser}${c.reset}`)
  console.log(`  PROD_WEB_API_URL = ${c.bold}${apiUrl}${c.reset}`)

  if (privateKey) {
    console.log(`\n  SSH_PRIVATE_KEY  = （下方私钥内容）\n`)
    console.log(`${c.yellow}${'─'.repeat(44)}${c.reset}`)
    console.log(privateKey.trim())
    console.log(`${c.yellow}${'─'.repeat(44)}${c.reset}`)
  }
  else {
    console.log(`  SSH_PRIVATE_KEY  = （请手动添加部署私钥）`)
  }

  console.log('\n提交更新后的部署配置：')
  console.log(`  git add .github/workflows/deploy.yml`)
  console.log(`  git commit -m "ci: 初始化部署配置"`)
  console.log(`  git push\n`)
  console.log('然后在 GitHub Actions 页面手动触发 Deploy 工作流，完成首次部署。\n')
}

// ── Main ──────────────────────────────────────────────────────────────────────

const config = await collectConfig()

step('测试 SSH 连接')
const testResult = await sshExec(config, 'echo connected')
if (!testResult.ok) {
  die(`SSH 连接失败，请检查：\n  - 服务器地址：${config.serverHost}\n  - 用户名：${config.initUser}\n  - 私钥路径：${config.initKeyPath}`)
}
ok(`已连接到 ${config.initUser}@${config.serverHost}`)

step('初始化服务器（用户、目录、systemd 服务）')
await sshRootScript(config, buildServerSetupScript(config))
ok('服务器初始化完成')

if (config.configureNginx) {
  step('配置 Nginx')
  await sshRootScript(config, buildNginxScript(config))
  ok('Nginx 配置完成')

  if (config.httpsMethod === 'letsencrypt') {
    step("配置 HTTPS (Let's Encrypt)")
    await sshRootScript(config, buildLetsEncryptScript(config))
    ok('HTTPS 证书申请完成，nginx 已自动更新')
  }
}
else {
  warn('已跳过 Nginx 配置，请手动创建')
}

let privateKey: string | undefined
if (config.generateKey) {
  step('生成并配置部署 SSH 密钥')
  privateKey = await setupDeployKey(config)
}

step('更新本地 deploy.yml')
updateDeployYml(config)

printSummary(config, privateKey)
