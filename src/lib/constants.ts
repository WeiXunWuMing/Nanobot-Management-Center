import path from "path"
import fs from "fs"

function detectProfilesDir(): string {
  // 1. Environment variable takes priority
  if (process.env.PROFILES_DIR) return process.env.PROFILES_DIR

  // 2. Check parent directory (recommended: project sits next to profiles/)
  const parentDir = path.resolve(process.cwd(), "..")
  const parentProfiles = path.join(parentDir, "profiles")
  if (fs.existsSync(parentProfiles)) return parentProfiles

  // 3. Check if we're inside a nested directory (e.g., /opt/.../nanobot-admin/)
  //    and profiles is at the root level
  const segments = process.cwd().split(path.sep)
  for (let i = segments.length - 1; i >= 1; i--) {
    const candidate = path.join(segments.slice(0, i).join(path.sep) || "/", "profiles")
    if (fs.existsSync(candidate)) return candidate
  }

  // 4. Default: use parent directory's profiles (will be created if needed)
  return path.join(parentDir, "profiles")
}

export const PROFILES_BASE_DIR = detectProfilesDir()
export const DEFAULT_PROFILE_DIR = path.join(PROFILES_BASE_DIR, "default")

export const NANOBOT_IMAGE = process.env.NANOBOT_IMAGE || "nanobot:api"
export const NANOBOT_PLAYWRIGHT_IMAGE = process.env.NANOBOT_PLAYWRIGHT_IMAGE || "nanobot:playwright"
export const NANOBOT_PATCHED_IMAGE = process.env.NANOBOT_PATCHED_IMAGE || "nanobot:patched"
export const NANOBOT_CONTAINER_PORT = 18790
export const NANOBOT_API_PORT = 8900
export const NANOBOT_WEBSOCKET_PORT = 8765
export const PORT_RANGE_START = 18790
export const PORT_RANGE_END = 18890
export const WS_PORT_RANGE_START = 18900
export const WS_PORT_RANGE_END = 19000

export const INSTANCE_LABEL_PREFIX = "nanobot.managed"
export const INSTANCE_LABEL_NAME = "nanobot.instance"
export const INSTANCE_LABEL_PLATFORM = "nanobot.platform"
export const PLATFORM_NAME = "nanobot-admin"

export const CONTAINER_NAME_PREFIX = "nanobot-gateway-"

export function getDockerSocketPath(): string {
  if (process.platform === "win32") {
    return "//./pipe/docker_engine"
  }
  return process.env.DOCKER_SOCKET || "/var/run/docker.sock"
}
