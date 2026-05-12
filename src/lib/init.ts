import fs from "fs"
import path from "path"
import { PROFILES_BASE_DIR, DEFAULT_PROFILE_DIR } from "./constants"

const DEFAULT_CONFIG = {
  agents: {
    defaults: {
      model: "anthropic/claude-sonnet-4-20250514",
      provider: "auto",
      workspace: "~/.nanobot/workspace",
      maxTokens: 8192,
      contextWindowTokens: 65536,
      temperature: 0.1,
      maxToolIterations: 200,
      timezone: "Asia/Shanghai",
      disabledSkills: [],
    },
  },
  channels: {},
  providers: {
    anthropic: { apiKey: "" },
  },
  tools: {
    web: {
      enable: true,
      search: { provider: "duckduckgo", maxResults: 5, timeout: 30 },
      fetch: { useJinaReader: true },
    },
    exec: { enable: true, timeout: 60 },
    my: { enable: true, allowSet: false },
    imageGeneration: { enabled: false },
    mcpServers: {},
  },
  gateway: { host: "0.0.0.0", port: 18790 },
  api: { host: "127.0.0.1", port: 8900, timeout: 120 },
}

const SUB_DIRS = ["workspace", "cron", "media", "weixin", "history"]

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function writeFileIfNotExists(filePath: string, content: string) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content, "utf-8")
  }
}

export function initializePlatform(): { success: boolean; message: string; profilesDir: string } {
  try {
    // 1. Ensure profiles base directory exists
    ensureDir(PROFILES_BASE_DIR)

    // 2. Ensure default profile directory exists
    ensureDir(DEFAULT_PROFILE_DIR)

    // 3. Create subdirectories for default profile
    for (const dir of SUB_DIRS) {
      ensureDir(path.join(DEFAULT_PROFILE_DIR, dir))
    }

    // 4. Create default config.json if it doesn't exist
    const configPath = path.join(DEFAULT_PROFILE_DIR, "config.json")
    writeFileIfNotExists(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2))

    // 5. Ensure data directory exists for SQLite
    const dataDir = path.join(process.cwd(), "data")
    ensureDir(dataDir)

    return {
      success: true,
      message: `Platform initialized. Profiles directory: ${PROFILES_BASE_DIR}`,
      profilesDir: PROFILES_BASE_DIR,
    }
  } catch (error) {
    return {
      success: false,
      message: `Initialization failed: ${String(error)}`,
      profilesDir: PROFILES_BASE_DIR,
    }
  }
}

export function getPlatformStatus() {
  const profilesExist = fs.existsSync(PROFILES_BASE_DIR)
  const defaultExist = fs.existsSync(DEFAULT_PROFILE_DIR)
  const configExist = fs.existsSync(path.join(DEFAULT_PROFILE_DIR, "config.json"))

  let instanceCount = 0
  if (profilesExist) {
    const entries = fs.readdirSync(PROFILES_BASE_DIR, { withFileTypes: true })
    instanceCount = entries.filter((e) => e.isDirectory() && e.name !== "default").length
  }

  return {
    profilesDir: PROFILES_BASE_DIR,
    profilesExist,
    defaultExist,
    configExist,
    instanceCount,
    initialized: profilesExist && defaultExist && configExist,
  }
}
