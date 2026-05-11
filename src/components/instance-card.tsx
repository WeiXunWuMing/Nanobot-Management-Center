"use client"

import { useState } from "react"
import Link from "next/link"
import { cn, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Play,
  Square,
  RotateCw,
  Trash2,
  Settings,
  FileText,
  MoreVertical,
  Loader2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Instance {
  id: string
  name: string
  containerId: string | null
  port: number
  status: string
  description: string | null
  createdAt: string
  updatedAt: string
  config?: Record<string, unknown> | null
}

interface InstanceCardProps {
  instance: Instance
  onRefresh: () => void
}

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  running: { label: "运行中", color: "text-green-700 bg-green-50 border-green-200", dot: "bg-green-500" },
  stopped: { label: "已停止", color: "text-gray-700 bg-gray-50 border-gray-200", dot: "bg-gray-400" },
  error: { label: "错误", color: "text-red-700 bg-red-50 border-red-200", dot: "bg-red-500" },
  creating: { label: "创建中", color: "text-blue-700 bg-blue-50 border-blue-200", dot: "bg-blue-500 animate-pulse" },
}

export function InstanceCard({ instance, onRefresh }: InstanceCardProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const status = statusConfig[instance.status] || statusConfig.stopped

  async function handleAction(action: string) {
    setLoading(action)
    try {
      const url =
        action === "delete"
          ? `/api/instances/${instance.id}?keepProfile=true`
          : `/api/instances/${instance.id}/${action}`
      const method = action === "delete" ? "DELETE" : "POST"
      const res = await fetch(url, { method })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || "操作失败")
      } else {
        if (action === "delete") {
          setDeleteDialogOpen(false)
        }
        onRefresh()
      }
    } catch (e) {
      alert(String(e))
    } finally {
      setLoading(null)
    }
  }

  const model = (instance.config as Record<string, unknown>)?.agents as Record<string, unknown> | undefined
  const defaults = model?.defaults as Record<string, unknown> | undefined
  const modelName = defaults?.model as string | undefined

  return (
    <>
      <div className="group relative rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold">{instance.name}</h3>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  status.color
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
                {status.label}
              </span>
            </div>
            {instance.description && (
              <p className="text-sm text-muted-foreground">{instance.description}</p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/instances/${instance.id}`}>
                  <Settings className="mr-2 h-4 w-4" />
                  配置
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/instances/${instance.id}/logs`}>
                  <FileText className="mr-2 h-4 w-4" />
                  日志
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onSelect={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4 flex items-center gap-6 text-sm text-muted-foreground">
          <span>
            端口: <span className="font-mono text-foreground">{instance.port}</span>
          </span>
          {modelName && (
            <span>
              模型: <span className="font-mono text-foreground">{modelName}</span>
            </span>
          )}
          <span>更新: {formatDate(instance.updatedAt)}</span>
        </div>

        <div className="mt-4 flex items-center gap-2">
          {instance.status !== "running" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction("start")}
              disabled={loading !== null}
            >
              {loading === "start" ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="mr-1.5 h-3.5 w-3.5" />
              )}
              启动
            </Button>
          )}
          {instance.status === "running" && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction("stop")}
                disabled={loading !== null}
              >
                {loading === "stop" ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Square className="mr-1.5 h-3.5 w-3.5" />
                )}
                停止
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction("restart")}
                disabled={loading !== null}
              >
                {loading === "restart" ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCw className="mr-1.5 h-3.5 w-3.5" />
                )}
                重启
              </Button>
            </>
          )}
          <div className="flex-1" />
          <Button size="sm" variant="ghost" asChild>
            <Link href={`/instances/${instance.id}`}>
              <Settings className="mr-1.5 h-3.5 w-3.5" />
              配置
            </Link>
          </Button>
          <Button size="sm" variant="ghost" asChild>
            <Link href={`/instances/${instance.id}/logs`}>
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              日志
            </Link>
          </Button>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除实例 <strong>{instance.name}</strong> 吗？容器将被移除，但 profile
              目录会保留。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleAction("delete")}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
