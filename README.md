# Nanobot 管理中心

Nanobot 多实例管理平台 - 可视化管理 nanobot AI Agent 实例。

## 功能特性

- **实例管理**：创建/删除/启停/重启 Docker 容器
- **配置编辑**：表单模式 + JSON 编辑器双模式
- **聊天界面**：直接在页面内与 nanobot 对话
- **日志查看**：实时日志流，北京时间显示
- **Skills 管理**：预设 Skills 一键安装
- **环境检查**：Docker 状态监控

## 快速开始

### 推荐目录结构

```bash
/opt/1panel/docker/compose/nanobot/
├── profiles/              # nanobot 实例数据
│   ├── default/           # 默认模板（自动创建）
│   ├── my-bot/            # 实例 1
│   └── assistant/         # 实例 2
└── nanobot-admin/         # 本项目（git clone 到这里）
```

### 安装步骤

```bash
# 1. 进入 nanobot 目录
cd /opt/1panel/docker/compose/nanobot

# 2. 克隆管理平台
git clone https://github.com/your-username/nanobot-admin.git
cd nanobot-admin

# 3. 安装依赖
npm install

# 4. 启动开发服务器
npm run dev
```

访问 http://localhost:3000 即可使用。

### 自动检测

管理平台会自动检测 `profiles` 目录位置：

1. 优先使用环境变量 `PROFILES_DIR`
2. 检查父目录是否存在 `profiles/` 文件夹
3. 向上递归查找
4. 默认使用父目录的 `profiles/`

首次启动时会自动创建 `profiles/default/` 模板目录。

### Docker 部署

```bash
# 构建镜像
docker build -t nanobot-admin .

# 运行
docker compose up -d
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PROFILES_DIR` | 自动检测 | profiles 目录路径 |
| `DOCKER_SOCKET` | `/var/run/docker.sock` | Docker socket 路径 |
| `NANOBOT_IMAGE` | `nanobot:latest` | nanobot Docker 镜像 |
| `DB_PATH` | `./data/nanobot-admin.db` | SQLite 数据库路径 |
| `PORT` | `3000` | 服务端口 |

复制 `.env.example` 为 `.env.local` 进行配置。

## 技术栈

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Dockerode (Docker API)
- SQLite (better-sqlite3)

## 许可证

MIT
