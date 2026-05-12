"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, ExternalLink, Loader2, RefreshCw } from "lucide-react"

interface ChatPanelProps {
  instanceName: string
  wsPort: number | null
  status: string
}

export function ChatPanel({ instanceName, wsPort, status }: ChatPanelProps) {
  const [loading, setLoading] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)

  const chatUrl = wsPort ? `http://127.0.0.1:${wsPort}` : null

  const handleRefresh = useCallback(() => {
    setIframeKey((k) => k + 1)
  }, [])

  const handleOpenExternal = useCallback(() => {
    if (chatUrl) {
      window.open(chatUrl, "_blank")
    }
  }, [chatUrl])

  if (status !== "running") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">实例未运行</h3>
          <p className="text-sm text-muted-foreground">
            请先启动实例才能使用聊天功能
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!wsPort) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">未配置 WebSocket 端口</h3>
          <p className="text-sm text-muted-foreground">
            此实例创建时未启用 WebSocket 渠道，无法使用聊天功能。
            请重新创建实例并确保启用 WebSocket。
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <span className="font-medium">聊天界面</span>
          <span className="text-xs text-muted-foreground">
            {instanceName} · 端口 {wsPort}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-1 h-3 w-3" />
            刷新
          </Button>
          <Button size="sm" variant="outline" onClick={handleOpenExternal}>
            <ExternalLink className="mr-1 h-3 w-3" />
            新窗口打开
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-background" style={{ height: "calc(100vh - 320px)" }}>
        <iframe
          key={iframeKey}
          src={chatUrl || undefined}
          className="h-full w-full rounded-lg"
          style={{ border: "none" }}
          title={`${instanceName} 聊天`}
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </div>
  )
}
