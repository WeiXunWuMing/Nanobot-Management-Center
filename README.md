# Nanobot 管理中心

Nanobot 多实例管理平台 —— 可视化管理 nanobot AI Agent 实例，一键创建、配置、监控。

## 功能特性

| 功能 | 说明 |
|------|------|
| 实例管理 | 创建/删除/启停/重启/重建 Docker 容器 |
| 配置编辑 | 表单模式 + JSON 编辑器双模式 |
| 渠道配置 | 微信/Telegram/Discord 等 10+ 渠道可视化配置 |
| 人设管理 | 在线编辑 SOUL.md、USER.md 等 Prompt 文件 |
| Skills 管理 | 预设 Skills 一键安装 |
| 日志查看 | 实时日志流，北京时间显示 |
| 环境检查 | Docker 状态监控 |

## 前置条件

- Docker 已安装并运行
- Node.js >= 18
- npm

## 快速开始

### 第一步：克隆项目

推荐将管理平台放在 nanobot profiles 目录的**同级目录**下：

```bash
# 进入你的 nanobot 部署目录
cd /opt/1panel/docker/compose/nanobot

# 克隆管理平台
git clone https://github.com/your-username/nanobot-admin.git
cd nanobot-admin
```

**目录结构：**

```
/opt/1panel/docker/compose/nanobot/
├── profiles/                  # nanobot 实例数据目录
│   ├── default/               # 默认模板（自动创建）
│   ├── my-bot/                # 实例 1
│   └── assistant/             # 实例 2
└── nanobot-admin/             # 管理平台（你在这里）
```

### 第二步：安装依赖

```bash
npm install
```

### 第三步：启动

```bash
npm run dev
```

浏览器访问 http://localhost:3000

### 第四步：创建实例

1. 点击「新建实例」
2. 填写实例名称
3. 选择 LLM Provider，填写 API Key
4. 点击「创建实例」

管理平台自动创建 `profiles/{name}/` 目录、生成 config.json、启动 Docker 容器。

## 目录自动检测

管理平台自动检测 `profiles` 目录位置：

1. 环境变量 `PROFILES_DIR`
2. 项目父目录下的 `profiles/`
3. 向上递归查找
4. 默认：父目录的 `profiles/`

## 环境变量

复制 `.env.example` 为 `.env.local`：

```bash
cp .env.example .env.local
```

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PROFILES_DIR` | 自动检测 | profiles 目录路径 |
| `DOCKER_SOCKET` | `/var/run/docker.sock` | Docker socket 路径 |
| `NANOBOT_IMAGE` | `nanobot:latest` | nanobot Docker 镜像 |
| `DB_PATH` | `./data/nanobot-admin.db` | SQLite 数据库路径 |
| `PORT` | `3000` | 服务端口 |

## 渠道配置

| 渠道 | 认证方式 |
|------|---------|
| 个人微信 | QR 码扫码登录 |
| Telegram | Bot Token |
| Discord | Bot Token |
| Slack | Bot Token + App Token |
| 飞书 | App ID + Secret |
| 钉钉 | Client ID + Secret |
| 企业微信 | Bot ID + Secret |
| QQ | App ID + Secret |
| 邮件 | IMAP/SMTP |
| WebSocket | 内置 |

## 预设 Skills

| Skill | 用途 |
|-------|------|
| agent-browser | 浏览器自动化 |
| context7 | 文档查询 |
| github-cli | GitHub 操作 |
| code-sandbox | 代码执行 |
| tavily | AI 搜索 |
| api-caller | HTTP API 调用 |
| filesystem | 文件操作 |

## 人设管理

每个实例的 workspace 目录包含：

| 文件 | 说明 |
|------|------|
| SOUL.md | Agent 人格定义 |
| USER.md | 用户画像 |
| AGENTS.md | Agent 行为指令 |
| TOOLS.md | 工具使用指南 |
| HEARTBEAT.md | 心跳任务 |
| memory/MEMORY.md | 长期记忆 |

首次访问人设管理时自动创建默认模板。

## Docker 部署

```bash
docker build -t nanobot-admin .
docker compose up -d
```

## 技术栈

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Dockerode
- SQLite (better-sqlite3)

## 许可证

MIT
