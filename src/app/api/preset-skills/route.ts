import { NextRequest } from "next/server"
import fs from "fs"
import path from "path"

const PRESET_SKILLS_DIR = path.join(process.cwd(), "data", "preset-skills")

export async function GET(request: NextRequest) {
  try {
    if (!fs.existsSync(PRESET_SKILLS_DIR)) {
      return Response.json({ skills: [] })
    }

    const entries = fs.readdirSync(PRESET_SKILLS_DIR, { withFileTypes: true })
    const skills = []

    for (const entry of entries) {
      if (!entry.isDirectory()) continue

      const skillMdPath = path.join(PRESET_SKILLS_DIR, entry.name, "SKILL.md")
      if (!fs.existsSync(skillMdPath)) continue

      const content = fs.readFileSync(skillMdPath, "utf-8")
      const frontmatter = parseFrontmatter(content)

      skills.push({
        name: entry.name,
        description: frontmatter.description || "",
        emoji: frontmatter.metadata?.nanobot?.emoji || "🔧",
      })
    }

    return Response.json({ skills })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}

function parseFrontmatter(content: string): Record<string, any> {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return {}

  const lines = match[1].split("\n")
  const result: Record<string, any> = {}

  for (const line of lines) {
    const colonIndex = line.indexOf(":")
    if (colonIndex === -1) continue

    const key = line.slice(0, colonIndex).trim()
    let value: any = line.slice(colonIndex + 1).trim()

    // Try to parse JSON values
    if (value.startsWith("{") || value.startsWith("[")) {
      try {
        value = JSON.parse(value)
      } catch {}
    }

    result[key] = value
  }

  return result
}
