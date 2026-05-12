import fs from "fs"
import path from "path"
import { PROFILES_BASE_DIR, DEFAULT_PROFILE_DIR } from "./constants"

export function getProfilePath(instanceName: string) {
  return path.join(PROFILES_BASE_DIR, instanceName)
}

export function profileExists(instanceName: string) {
  return fs.existsSync(getProfilePath(instanceName))
}

export function createProfile(instanceName: string) {
  const targetDir = getProfilePath(instanceName)

  if (fs.existsSync(targetDir)) {
    return
  }

  if (!fs.existsSync(DEFAULT_PROFILE_DIR)) {
    fs.mkdirSync(DEFAULT_PROFILE_DIR, { recursive: true })
  }

  fs.mkdirSync(targetDir, { recursive: true })
  copyDirSync(DEFAULT_PROFILE_DIR, targetDir)
}

function copyDirSync(src: string, dest: string) {
  if (!fs.existsSync(src)) return
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }
  const entries = fs.readdirSync(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true })
      copyDirSync(srcPath, destPath)
    } else {
      // Ensure parent directory exists for file
      const destDir = path.dirname(destPath)
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true })
      }
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

export function removeProfile(instanceName: string) {
  const targetDir = getProfilePath(instanceName)
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true })
  }
}

export function readConfig(instanceName: string): Record<string, unknown> | null {
  const configPath = path.join(getProfilePath(instanceName), "config.json")
  if (!fs.existsSync(configPath)) return null
  try {
    const content = fs.readFileSync(configPath, "utf-8")
    return JSON.parse(content)
  } catch {
    return null
  }
}

export function writeConfig(instanceName: string, config: Record<string, unknown>) {
  const configPath = path.join(getProfilePath(instanceName), "config.json")
  const dir = path.dirname(configPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8")
}

export function listProfiles(): string[] {
  if (!fs.existsSync(PROFILES_BASE_DIR)) return []
  return fs
    .readdirSync(PROFILES_BASE_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== "default")
    .map((d) => d.name)
}

export function ensureDirectories() {
  if (!fs.existsSync(PROFILES_BASE_DIR)) {
    fs.mkdirSync(PROFILES_BASE_DIR, { recursive: true })
  }
  if (!fs.existsSync(DEFAULT_PROFILE_DIR)) {
    fs.mkdirSync(DEFAULT_PROFILE_DIR, { recursive: true })
  }
}

export function getWorkspacePath(instanceName: string) {
  return path.join(getProfilePath(instanceName), "workspace")
}

export function listWorkspaceFiles(instanceName: string): Array<{ name: string; path: string; type: string }> {
  const workspaceDir = getWorkspacePath(instanceName)
  if (!fs.existsSync(workspaceDir)) return []

  const files: Array<{ name: string; path: string; type: string }> = []

  const mdFiles = ["SOUL.md", "USER.md", "AGENTS.md", "TOOLS.md", "HEARTBEAT.md"]
  for (const f of mdFiles) {
    const fp = path.join(workspaceDir, f)
    if (fs.existsSync(fp)) {
      files.push({ name: f, path: f, type: "persona" })
    }
  }

  const memoryDir = path.join(workspaceDir, "memory")
  if (fs.existsSync(memoryDir)) {
    const memoryMd = path.join(memoryDir, "MEMORY.md")
    if (fs.existsSync(memoryMd)) {
      files.push({ name: "MEMORY.md", path: "memory/MEMORY.md", type: "memory" })
    }
  }

  const skillsDir = path.join(workspaceDir, "skills")
  if (fs.existsSync(skillsDir)) {
    try {
      const skillEntries = fs.readdirSync(skillsDir, { withFileTypes: true })
      for (const entry of skillEntries) {
        if (entry.isDirectory()) {
          const skillMd = path.join(skillsDir, entry.name, "SKILL.md")
          if (fs.existsSync(skillMd)) {
            files.push({
              name: `${entry.name}/SKILL.md`,
              path: `skills/${entry.name}/SKILL.md`,
              type: "skill",
            })
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return files
}

export function readWorkspaceFile(instanceName: string, filePath: string): string | null {
  const workspaceDir = getWorkspacePath(instanceName)
  const fullPath = path.join(workspaceDir, filePath)

  const resolved = path.resolve(fullPath)
  if (!resolved.startsWith(path.resolve(workspaceDir))) {
    return null
  }

  if (!fs.existsSync(fullPath)) return null
  try {
    return fs.readFileSync(fullPath, "utf-8")
  } catch {
    return null
  }
}

export function writeWorkspaceFile(instanceName: string, filePath: string, content: string) {
  const workspaceDir = getWorkspacePath(instanceName)
  const fullPath = path.join(workspaceDir, filePath)

  const resolved = path.resolve(fullPath)
  if (!resolved.startsWith(path.resolve(workspaceDir))) {
    throw new Error("Invalid path")
  }

  const dir = path.dirname(fullPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(fullPath, content, "utf-8")
}

const PRESET_SKILLS_DIR = path.join(process.cwd(), "data", "preset-skills")

export function installPresetSkill(instanceName: string, skillName: string): { success: boolean; error?: string } {
  const presetDir = path.join(PRESET_SKILLS_DIR, skillName)
  if (!fs.existsSync(presetDir)) {
    return { success: false, error: `预设 skill "${skillName}" 不存在` }
  }

  const workspaceDir = getWorkspacePath(instanceName)
  const skillsDir = path.join(workspaceDir, "skills")

  // Ensure workspace directory exists
  if (!fs.existsSync(workspaceDir)) {
    fs.mkdirSync(workspaceDir, { recursive: true })
  }

  // Ensure skills directory exists
  if (!fs.existsSync(skillsDir)) {
    fs.mkdirSync(skillsDir, { recursive: true })
  }

  const targetDir = path.join(skillsDir, skillName)
  if (fs.existsSync(targetDir)) {
    return { success: false, error: `skill "${skillName}" 已存在` }
  }

  // Create target directory before copying
  fs.mkdirSync(targetDir, { recursive: true })
  copyDirSync(presetDir, targetDir)
  return { success: true }
}

export function uninstallSkill(instanceName: string, skillName: string): { success: boolean; error?: string } {
  const skillsDir = path.join(getWorkspacePath(instanceName), "skills")
  const targetDir = path.join(skillsDir, skillName)

  if (!fs.existsSync(targetDir)) {
    return { success: false, error: `skill "${skillName}" 不存在` }
  }

  fs.rmSync(targetDir, { recursive: true, force: true })
  return { success: true }
}
