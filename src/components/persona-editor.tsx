"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Save, FileText, RefreshCw } from "lucide-react"

interface PersonaEditorProps {
  instanceId: string
}

interface WorkspaceFile {
  name: string
  path: string
  type: string
}

const FILE_LABELS: Record<string, string> = {
  "SOUL.md": "人格定义",
  "USER.md": "用户画像",
  "AGENTS.md": "Agent 指令",
  "TOOLS.md": "工具指南",
  "HEARTBEAT.md": "心跳任务",
  "memory/MEMORY.md": "长期记忆",
}

const FILE_DESCRIPTIONS: Record<string, string> = {
  "SOUL.md": "定义 Agent 的核心身份、人格和行为准则。由 Dream 系统自动维护。",
  "USER.md": "存储用户个性化信息，如偏好、工作上下文等。由 Dream 系统自动维护。",
  "AGENTS.md": "Agent 的行为指令，包括定时提醒规则和心跳任务管理。",
  "TOOLS.md": "工具使用的非显而易见约束和注意事项。",
  "HEARTBEAT.md": "每 30 分钟由 Agent 检查一次的周期性任务清单。",
  "memory/MEMORY.md": "跨会话的长期记忆，由 Dream 系统自动更新。",
}

export function PersonaEditor({ instanceId }: PersonaEditorProps) {
  const [files, setFiles] = useState<WorkspaceFile[]>([])
  const [selectedFile, setSelectedFile] = useState<string>("")
  const [content, setContent] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch(`/api/instances/${instanceId}/workspace`)
      const data = await res.json()
      setFiles(data.files || [])
      if (!selectedFile && data.files?.length > 0) {
        setSelectedFile(data.files[0].path)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [instanceId, selectedFile])

  const fetchContent = useCallback(async (filePath: string) => {
    try {
      const res = await fetch(`/api/instances/${instanceId}/workspace?path=${encodeURIComponent(filePath)}`)
      const data = await res.json()
      setContent(data.content || "")
      setDirty(false)
    } catch (e) {
      console.error(e)
    }
  }, [instanceId])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  useEffect(() => {
    if (selectedFile) {
      fetchContent(selectedFile)
    }
  }, [selectedFile, fetchContent])

  async function handleSave() {
    if (!selectedFile) return
    setSaving(true)
    try {
      const res = await fetch(`/api/instances/${instanceId}/workspace`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: selectedFile, content }),
      })
      if (res.ok) {
        setDirty(false)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const personaFiles = files.filter((f) => f.type === "persona" || f.type === "memory")
  const skillFiles = files.filter((f) => f.type === "skill")

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {personaFiles.map((f) => (
          <Button
            key={f.path}
            size="sm"
            variant={selectedFile === f.path ? "default" : "outline"}
            onClick={() => setSelectedFile(f.path)}
          >
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            {FILE_LABELS[f.name] || f.name}
          </Button>
        ))}
        {skillFiles.length > 0 && (
          <>
            <span className="text-muted-foreground self-center text-sm">|</span>
            {skillFiles.map((f) => (
              <Button
                key={f.path}
                size="sm"
                variant={selectedFile === f.path ? "default" : "outline"}
                onClick={() => setSelectedFile(f.path)}
              >
                {f.name}
              </Button>
            ))}
          </>
        )}
      </div>

      {selectedFile && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">{selectedFile}</CardTitle>
                {FILE_DESCRIPTIONS[selectedFile] && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {FILE_DESCRIPTIONS[selectedFile]}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {dirty && <Badge variant="secondary">未保存</Badge>}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fetchContent(selectedFile)}
                >
                  <RefreshCw className="mr-1 h-3 w-3" />
                  刷新
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving || !dirty}>
                  {saving ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <Save className="mr-1 h-3 w-3" />
                  )}
                  保存
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <textarea
              className="h-[400px] w-full resize-none rounded-md border bg-muted/30 p-4 font-mono text-sm leading-relaxed outline-none focus:ring-1 focus:ring-ring"
              value={content}
              onChange={(e) => {
                setContent(e.target.value)
                setDirty(true)
              }}
              spellCheck={false}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
