# Nanobot 管理中心

Nanobot 多实例管理平台 —— 可视化管理 nanobot AI Agent 实例，一键创建、配置、监控。

## 功能特性

| 功能 | 说明 |
|------|------|
| 实例管理 | 创建/删除/启停/重启 Docker 容器 |
| 聊天界面 | 直接在页面内与 nanobot 对话 |
| 配置编辑 | 表单模式 + JSON 编辑器双模式 |
| 渠道配置 | 微信/Telegram/Discord 等 10+ 渠道可视化配置 |
| 日志查看 | 实时日志流，北京时间显示 |
| Skills 管理 | 预设 Skills 一键安装 |
| 环境检查 | Docker 状态监控 |

## 前置条件

- Docker 已安装并运行
- Node.js >= 18
- npm 或 pnpm

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

**目录结构示意：**

```
/opt/1panel/docker/compose/nanobot/
├── profiles/                  # nanobot 实例数据目录
│   ├── default/               # 默认模板（管理平台自动创建）
│   ├── my-bot/                # 你的实例 1
│   └── assistant/             # 你的实例 2
├── nanobot-admin/             # 管理平台（你在这里）
│   ├── src/
│   ├── package.json
│   └── ...
└── docker-compose.yaml        # 原有的 nanobot compose 文件（如有）
```

### 第二步：安装依赖

```bash
npm install
```

### 第三步：启动

```bash
npm run dev
```

浏览器访问 http://localhost:3000 即可使用。

### 第四步：创建第一个实例

1. 点击左侧菜单「新建实例」
2. 填写实例名称（如 `my-bot`）
3. 选择 LLM Provider（如 DeepSeek）
4. 填写 API Key
5. 点击「创建实例」

管理平台会自动：
- 创建 `profiles/my-bot/` 目录
- 生成 config.json 配置文件
- 创建并启动 Docker 容器

## 目录自动检测

管理平台会自动检测 `profiles` 目录位置，检测顺序：

1. 环境变量 `PROFILES_DIR`
2. 项目父目录下的 `profiles/`
3. 向上递归查找
4. 默认使用父目录的 `profiles/`

**常见部署方式：**

```
# 方式 1：推荐，放在 nanobot 同级目录
/opt/nanobot/profiles/
/opt/nanobot/nanobot-admin/    ← 管理平台

# 方式 2：放在任意位置，通过环境变量指定
/home/user/my-project/         ← 管理平台
PROFILES_DIR=/opt/nanobot/profiles

# 方式 3：放在 profiles 目录内部
/opt/nanobot/profiles/nanobot-admin/  ← 也能自动找到上级 profiles
```

## 环境变量

复制 `.env.example` 为 `.env.local` 进行配置：

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

## Docker 部署

```bash
# 构建镜像
docker build -t nanobot-admin .

# 运行
docker compose up -d
```

## 新建实例选项

创建实例时可选：

| 选项 | 说明 |
|------|------|
| 预装 Playwright | 浏览器自动化支持，镜像 +400MB |
| 启用多消息拆分 | Bot 回复多条短消息，模拟真人聊天 |

## 支持的渠道

| 渠道 | 说明 |
|------|------|
| 个人微信 | QR 码扫码登录 |
| Telegram | Bot Token |
| Discord | Bot Token |
| Slack | Bot Token + App Token |
| 飞书 | App ID + Secret |
| 钉钉 | Client ID + Secret |
| 企业微信 | Bot ID + Secret |
| QQ | App ID + Secret |
| 邮件 | IMAP/SMTP 配置 |
| WebSocket | 内置聊天界面 |

## 预设 Skills

管理平台提供 7 个预设 Skills，可一键安装到实例：

| Skill | 用途 |
|-------|------|
| agent-browser | 浏览器自动化 |
| context7 | 文档查询 |
| github-cli | GitHub 操作 |
| code-sandbox | 代码执行 |
| tavily | AI 搜索 |
| api-caller | HTTP API 调用 |
| filesystem | 文件操作 |

## 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **Docker**: Dockerode
- **数据库**: SQLite (better-sqlite3)

## 许可证

MIT
