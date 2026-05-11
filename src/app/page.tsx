"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Server, Play, Square, AlertCircle, Plus, Activity } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface Instance {
  id: string
  name: string
  status: string
  port: number
  updatedAt: string
}

export default function DashboardPage() {
  const [instances, setInstances] = useState<Instance[]>([])
  const [loading, setLoading] = useState(true)

  const fetchInstances = useCallback(async () => {
    try {
      const res = await fetch("/api/instances")
      const data = await res.json()
      setInstances(data.instances || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInstances()
  }, [fetchInstances])

  const running = instances.filter((i) => i.status === "running").length
  const stopped = instances.filter((i) => i.status === "stopped").length
  const error = instances.filter((i) => i.status === "error").length

  const stats = [
    { label: "总实例", value: instances.length, icon: Server, color: "text-blue-600 bg-blue-50" },
    { label: "运行中", value: running, icon: Play, color: "text-green-600 bg-green-50" },
    { label: "已停止", value: stopped, icon: Square, color: "text-gray-600 bg-gray-50" },
    { label: "异常", value: error, icon: AlertCircle, color: "text-red-600 bg-red-50" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">仪表盘</h1>
          <p className="text-muted-foreground">Nanobot 多实例管理平台</p>
        </div>
        <Button asChild>
          <Link href="/instances/new">
            <Plus className="mr-1.5 h-4 w-4" />
            新建实例
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={`rounded-lg p-3 ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              实例状态
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">加载中...</p>
            ) : instances.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-4">暂无实例</p>
                <Button asChild size="sm">
                  <Link href="/instances/new">创建第一个实例</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {instances.map((inst) => (
                  <Link
                    key={inst.id}
                    href={`/instances/${inst.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          inst.status === "running"
                            ? "bg-green-500"
                            : inst.status === "error"
                              ? "bg-red-500"
                              : "bg-gray-400"
                        }`}
                      />
                      <div>
                        <p className="font-medium">{inst.name}</p>
                        <p className="text-xs text-muted-foreground">端口 {inst.port}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(inst.updatedAt)}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>快捷操作</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/instances/new">
                <Plus className="mr-2 h-4 w-4" />
                新建实例
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/instances">
                <Server className="mr-2 h-4 w-4" />
                查看所有实例
              </Link>
            </Button>
            <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
              <p className="mb-2 font-medium text-foreground">快速开始</p>
              <ol className="list-inside list-decimal space-y-1">
                <li>点击「新建实例」创建 Nanobot 实例</li>
                <li>配置 LLM Provider 和 API Key</li>
                <li>选择需要的通信渠道</li>
                <li>启动实例并访问 Gateway</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
