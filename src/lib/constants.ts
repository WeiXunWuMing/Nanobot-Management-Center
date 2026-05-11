import path from "path"

export const PROFILES_BASE_DIR =
  process.env.PROFILES_DIR || "/opt/1panel/docker/compose/nanobot/profiles"

export const DEFAULT_PROFILE_DIR = path.join(PROFILES_BASE_DIR, "default")

export const NANOBOT_IMAGE = process.env.NANOBOT_IMAGE || "ghcr.io/nanobot-ai/nanobot:latest"
export const NANOBOT_CONTAINER_PORT = 18790
export const PORT_RANGE_START = 18790
export const PORT_RANGE_END = 18890

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
