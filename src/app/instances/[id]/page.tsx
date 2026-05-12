"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Save,
  Loader2,
  Play,
  Square,
  RotateCw,
  Trash2,
  FileText,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react"
import { AgentConfig } from "@/components/agent-config"
import { ChannelConfig } from "@/components/channel-config"
import { ToolsConfig } from "@/components/tools-config"
import { PersonaEditor } from "@/components/persona-editor"

interface Instance {
  id: string
  name: string
  containerId: string | null
  port: number
  wsPort: number | null
  status: string
  description: string | null
  createdAt: string
  updatedAt: string
  config?: Record<string, unknown> | null
  containerExists?: boolean
}

function JsonEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [copied, setCopied] = useState(false)

  function handleFormat() {
    try {
      onChange(JSON.stringify(JSON.parse(value), null, 2))
    } catch { /* ignore */ }
  }

  function handleCopy() {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b bg-muted/50 px-3 py-1.5">
        <Button size="sm" variant="ghost" onClick={handleFormat}>格式化</Button>
        <Button size="sm" variant="ghost" onClick={handleCopy}>
          {copied ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
          {copied ? "已复制" : "复制"}
        </Button>
      </div>
      <textarea
        className="flex-1 resize-none bg-[#1e1e1e] p-4 font-mono text-sm leading-relaxed text-gray-200 outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
      />
    </div>
  )
}

export default function InstanceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [instance, setInstance] = useState<Instance | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [config, setConfig] = useState<Record<string, unknown>>({})
  const [jsonConfig, setJsonConfig] = useState("")
  const [dirty, setDirty] = useState(false)

  // System-managed fields that should be auto-added when saving
  function applySystemFields(cfg: Record<string, unknown>): Record<string, unknown> {
    const result = JSON.parse(JSON.stringify(cfg))
    // Ensure weixin channel has allowFrom
    if (result.channels?.weixin?.enabled) {
      if (!result.channels.weixin.allowFrom || result.channels.weixin.allowFrom.length === 0) {
        result.channels.weixin.allowFrom = ["*"]
      }
    }
    return result
  }

  // Remove system-managed fields for display
  function filterSystemFields(cfg: Record<string, unknown>): Record<string, unknown> {
    const result = JSON.parse(JSON.stringify(cfg))
    // Remove allowFrom from display (system auto-manages it)
    if (result.channels?.weixin?.allowFrom) {
      delete result.channels.weixin.allowFrom
    }
    return result
  }

  const fetchInstance = useCallback(async () => {
    try {
      const res = await fetch(`/api/instances/${id}`)
      if (res.status === 404) {
        setInstance(null)
        setLoading(false)
        return
      }
      const data = await res.json()
      if (data.instance) {
        setInstance(data.instance)
        if (data.instance.config) {
          setConfig(data.instance.config)
          // Show filtered config in JSON editor
          setJsonConfig(JSON.stringify(filterSystemFields(data.instance.config), null, 2))
        }
        setDirty(false)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchInstance()
  }, [fetchInstance])

  function handleConfigChange(newConfig: Record<string, unknown>) {
    setConfig(newConfig)
    setJsonConfig(JSON.stringify(filterSystemFields(newConfig), null, 2))
    setDirty(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const configToSave = applySystemFields(config)
      const res = await fetch(`/api/instances/${id}/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: configToSave }),
      })
      if (res.ok) {
        setDirty(false)
        fetchInstance()
      } else {
        const data = await res.json()
        alert(data.error || "保存失败")
      }
    } catch (e) {
      alert(String(e))
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveJson() {
    setSaving(true)
    try {
      const parsed = JSON.parse(jsonConfig)
      const configToSave = applySystemFields(parsed)
      const res = await fetch(`/api/instances/${id}/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: configToSave }),
      })
      if (res.ok) {
        setConfig(configToSave)
        setDirty(false)
        fetchInstance()
      } else {
        const data = await res.json()
        alert(data.error || "保存失败")
      }
    } catch (e) {
      alert("JSON 格式错误: " + String(e))
    } finally {
      setSaving(false)
    }
  }

  async function handleAction(action: string) {
    setActionLoading(action)
    try {
      const url = action === "delete" ? `/api/instances/${id}?keepProfile=true` : `/api/instances/${id}/${action}`
      const method = action === "delete" ? "DELETE" : "POST"
      const res = await fetch(url, { method })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || "操作失败")
      }
      if (action === "delete") {
        router.push("/instances")
        return
      }
      fetchInstance()
    } catch (e) {
      alert(String(e))
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!instance) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">实例不存在</p>
        <Button variant="link" onClick={() => router.push("/instances")}>返回实例列表</Button>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    running: "text-green-600",
    stopped: "text-gray-500",
    error: "text-red-600",
    creating: "text-blue-600",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{instance.name}</h1>
            <span className={`text-sm font-medium ${statusColors[instance.status] || ""}`}>
              {instance.status === "running" ? "● 运行中" : instance.status === "stopped" ? "○ 已停止" : instance.status}
            </span>
            {instance.containerExists === false && (
              <Badge variant="destructive">容器已丢失</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            端口 {instance.port} · 容器 {instance.containerId?.slice(0, 12) || "无"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
              保存配置
            </Button>
          )}
          {instance.status !== "running" && (
            <Button size="sm" onClick={() => handleAction("start")} disabled={!!actionLoading}>
              {actionLoading === "start" ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Play className="mr-1.5 h-3.5 w-3.5" />}
              启动
            </Button>
          )}
          {instance.status === "running" && (
            <>
              <Button size="sm" variant="outline" onClick={() => handleAction("stop")} disabled={!!actionLoading}>
                {actionLoading === "stop" ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Square className="mr-1.5 h-3.5 w-3.5" />}
                停止
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleAction("restart")} disabled={!!actionLoading}>
                {actionLoading === "restart" ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RotateCw className="mr-1.5 h-3.5 w-3.5" />}
                重启
              </Button>
            </>
          )}
          <Button size="sm" variant="ghost" asChild>
            <a href={`/instances/${id}/logs`}>
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              日志
            </a>
          </Button>
        </div>
      </div>

      <Separator />

      <Tabs defaultValue="basic" onValueChange={(value) => {
        // Sync JSON editor when switching to JSON tab
        if (value === "json") {
          setJsonConfig(JSON.stringify(config, null, 2))
        }
      }}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">基础配置</TabsTrigger>
          <TabsTrigger value="channels">渠道配置</TabsTrigger>
          <TabsTrigger value="tools">工具配置</TabsTrigger>
          <TabsTrigger value="persona">人设管理</TabsTrigger>
          <TabsTrigger value="json">JSON 编辑器</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-4">
          <AgentConfig config={config} onChange={handleConfigChange} />
        </TabsContent>

        <TabsContent value="channels" className="mt-4">
          <ChannelConfig instanceId={id} config={config} onChange={handleConfigChange} />
        </TabsContent>

        <TabsContent value="tools" className="mt-4">
          <ToolsConfig instanceId={id} config={config} onChange={handleConfigChange} />
        </TabsContent>

        <TabsContent value="persona" className="mt-4">
          <PersonaEditor instanceId={id} />
        </TabsContent>

        <TabsContent value="json" className="mt-4">
          <div className="h-[600px] rounded-md border">
            <JsonEditor value={jsonConfig} onChange={(v) => { setJsonConfig(v); try { setConfig(JSON.parse(v)); setDirty(true) } catch {} }} />
          </div>
          <div className="mt-4 flex justify-between">
            <Button variant="outline" onClick={() => fetchInstance()}>
              <RefreshCw className="mr-1.5 h-4 w-4" />
              从磁盘刷新
            </Button>
            <Button onClick={handleSaveJson} disabled={saving}>
              {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
              保存 JSON
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
