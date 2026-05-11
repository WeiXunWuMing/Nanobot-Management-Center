"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Trash2, Settings, Download, Check } from "lucide-react"

interface ToolsConfigProps {
  instanceId: string
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

interface Skill {
  name: string
  path: string
  type: string
}

interface PresetSkill {
  name: string
  description: string
  emoji: string
}

export function ToolsConfig({ instanceId, config, onChange }: ToolsConfigProps) {
  const tools = (config.tools as Record<string, unknown>) || {}
  const web = (tools.web as Record<string, unknown>) || {}
  const exec = (tools.exec as Record<string, unknown>) || {}
  const mcpServers = (tools.mcpServers as Record<string, Record<string, unknown>>) || {}
  const disabledSkills = (config.agents as Record<string, unknown>)?.defaults
    ? ((config.agents as Record<string, Record<string, unknown>>).defaults.disabledSkills as string[]) || []
    : []

  const [skills, setSkills] = useState<Skill[]>([])
  const [skillsLoading, setSkillsLoading] = useState(true)
  const [presetSkills, setPresetSkills] = useState<PresetSkill[]>([])
  const [installing, setInstalling] = useState<string | null>(null)

  const fetchSkills = useCallback(() => {
    fetch(`/api/instances/${instanceId}/workspace`)
      .then((r) => r.json())
      .then((data) => {
        setSkills((data.files || []).filter((f: Skill) => f.type === "skill"))
        setSkillsLoading(false)
      })
      .catch(() => setSkillsLoading(false))
  }, [instanceId])

  useEffect(() => {
    fetchSkills()
    fetch("/api/preset-skills")
      .then((r) => r.json())
      .then((data) => setPresetSkills(data.skills || []))
      .catch(() => {})
  }, [fetchSkills])

  function updateTools(key: string, value: unknown) {
    const newConfig = JSON.parse(JSON.stringify(config))
    if (!newConfig.tools) newConfig.tools = {}
    newConfig.tools[key] = value
    onChange(newConfig)
  }

  function updateNestedTools(section: string, key: string, value: unknown) {
    const newConfig = JSON.parse(JSON.stringify(config))
    if (!newConfig.tools) newConfig.tools = {}
    if (!newConfig.tools[section]) newConfig.tools[section] = {}
    newConfig.tools[section][key] = value
    onChange(newConfig)
  }

  function toggleSkill(skillName: string, enable: boolean) {
    const newConfig = JSON.parse(JSON.stringify(config))
    if (!newConfig.agents) newConfig.agents = {}
    if (!newConfig.agents.defaults) newConfig.agents.defaults = {}
    if (!newConfig.agents.defaults.disabledSkills) newConfig.agents.defaults.disabledSkills = []

    if (enable) {
      newConfig.agents.defaults.disabledSkills = newConfig.agents.defaults.disabledSkills.filter(
        (s: string) => s !== skillName
      )
    } else {
      newConfig.agents.defaults.disabledSkills.push(skillName)
    }
    onChange(newConfig)
  }

  async function installSkill(skillName: string) {
    setInstalling(skillName)
    try {
      const res = await fetch(`/api/instances/${instanceId}/skills/install`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillName }),
      })
      const data = await res.json()
      if (res.ok) {
        fetchSkills()
      } else {
        alert(data.error || "安装失败")
      }
    } catch (e) {
      alert(String(e))
    } finally {
      setInstalling(null)
    }
  }

  async function uninstallSkill(skillName: string) {
    if (!confirm(`确定要卸载 ${skillName} 吗？`)) return
    try {
      const res = await fetch(`/api/instances/${instanceId}/skills/install?name=${skillName}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (res.ok) {
        fetchSkills()
      } else {
        alert(data.error || "卸载失败")
      }
    } catch (e) {
      alert(String(e))
    }
  }

  function addMcpServer() {
    const name = prompt("MCP Server 名称:")
    if (!name) return
    const newConfig = JSON.parse(JSON.stringify(config))
    if (!newConfig.tools) newConfig.tools = {}
    if (!newConfig.tools.mcpServers) newConfig.tools.mcpServers = {}
    newConfig.tools.mcpServers[name] = { type: "stdio", command: "", args: [] }
    onChange(newConfig)
  }

  function removeMcpServer(name: string) {
    const newConfig = JSON.parse(JSON.stringify(config))
    if (newConfig.tools?.mcpServers?.[name]) {
      delete newConfig.tools.mcpServers[name]
      onChange(newConfig)
    }
  }

  function updateMcpServer(name: string, key: string, value: unknown) {
    const newConfig = JSON.parse(JSON.stringify(config))
    if (!newConfig.tools) newConfig.tools = {}
    if (!newConfig.tools.mcpServers) newConfig.tools.mcpServers = {}
    if (!newConfig.tools.mcpServers[name]) newConfig.tools.mcpServers[name] = {}
    newConfig.tools.mcpServers[name][key] = value
    onChange(newConfig)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Web 搜索</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>启用 Web 搜索</Label>
            <Button
              size="sm"
              variant={web.enable !== false ? "default" : "outline"}
              onClick={() => updateNestedTools("web", "enable", web.enable === false)}
            >
              {web.enable !== false ? "已启用" : "已禁用"}
            </Button>
          </div>
          {web.enable !== false && (
            <div className="space-y-2">
              <Label>搜索引擎</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={(web.search as Record<string, string>)?.provider || "duckduckgo"}
                onChange={(e) => {
                  const newConfig = JSON.parse(JSON.stringify(config))
                  if (!newConfig.tools) newConfig.tools = {}
                  if (!newConfig.tools.web) newConfig.tools.web = {}
                  if (!newConfig.tools.web.search) newConfig.tools.web.search = {}
                  newConfig.tools.web.search.provider = e.target.value
                  onChange(newConfig)
                }}
              >
                <option value="duckduckgo">DuckDuckGo</option>
                <option value="brave">Brave</option>
                <option value="tavily">Tavily</option>
                <option value="searxng">SearXNG</option>
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shell 执行</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>启用 Shell</Label>
            <Button
              size="sm"
              variant={exec.enable !== false ? "default" : "outline"}
              onClick={() => updateNestedTools("exec", "enable", exec.enable === false)}
            >
              {exec.enable !== false ? "已启用" : "已禁用"}
            </Button>
          </div>
          {exec.enable !== false && (
            <div className="space-y-2">
              <Label>超时 (秒)</Label>
              <Input
                type="number"
                min={1}
                max={600}
                value={(exec.timeout as number) || 60}
                onChange={(e) => updateNestedTools("exec", "timeout", parseInt(e.target.value) || 60)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>MCP Servers</CardTitle>
            <Button size="sm" variant="outline" onClick={addMcpServer}>
              <Plus className="mr-1 h-3 w-3" />
              添加
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.keys(mcpServers).length === 0 ? (
            <p className="text-sm text-muted-foreground">未配置 MCP Server</p>
          ) : (
            Object.entries(mcpServers).map(([name, server]) => (
              <div key={name} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{name}</span>
                  <Button size="sm" variant="ghost" onClick={() => removeMcpServer(name)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">类型</Label>
                    <select
                      className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm"
                      value={(server.type as string) || "stdio"}
                      onChange={(e) => updateMcpServer(name, "type", e.target.value)}
                    >
                      <option value="stdio">stdio</option>
                      <option value="sse">SSE</option>
                      <option value="streamableHttp">Streamable HTTP</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">命令/URL</Label>
                    <Input
                      className="h-8 text-sm"
                      value={String(server.type === "stdio" ? server.command || "" : server.url || "")}
                      onChange={(e) =>
                        updateMcpServer(name, server.type === "stdio" ? "command" : "url", e.target.value)
                      }
                      placeholder={server.type === "stdio" ? "npx ..." : "http://..."}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>已安装 Skills</CardTitle>
        </CardHeader>
        <CardContent>
          {skillsLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : skills.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无已安装的 Skills</p>
          ) : (
            <div className="space-y-2">
              {skills.map((skill) => {
                const isDisabled = disabledSkills.includes(skill.name.replace("/SKILL.md", ""))
                const skillName = skill.name.replace("/SKILL.md", "")
                return (
                  <div key={skill.path} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-sm">{skillName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isDisabled ? (
                        <Badge variant="secondary">已禁用</Badge>
                      ) : (
                        <Badge className="bg-green-600 text-white">已启用</Badge>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleSkill(skillName, isDisabled)}
                      >
                        {isDisabled ? "启用" : "禁用"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => uninstallSkill(skillName)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>预设 Skills 库</CardTitle>
        </CardHeader>
        <CardContent>
          {presetSkills.length === 0 ? (
            <p className="text-sm text-muted-foreground">加载预设 Skills 中...</p>
          ) : (
            <div className="space-y-2">
              {presetSkills.map((preset) => {
                const isInstalled = skills.some((s) => s.name.replace("/SKILL.md", "") === preset.name)
                return (
                  <div key={preset.name} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{preset.emoji}</span>
                      <div>
                        <span className="font-medium">{preset.name}</span>
                        <p className="text-xs text-muted-foreground line-clamp-1">{preset.description}</p>
                      </div>
                    </div>
                    <div>
                      {isInstalled ? (
                        <Badge variant="secondary">
                          <Check className="mr-1 h-3 w-3" />
                          已安装
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => installSkill(preset.name)}
                          disabled={installing === preset.name}
                        >
                          {installing === preset.name ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <Download className="mr-1 h-3 w-3" />
                          )}
                          安装
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
