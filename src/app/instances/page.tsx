"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { InstanceCard } from "@/components/instance-card"
import { Plus, RefreshCw, Loader2, Server } from "lucide-react"

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

export default function InstancesPage() {
  const [instances, setInstances] = useState<Instance[]>([])
  const [loading, setLoading] = useState(true)

  const fetchInstances = useCallback(async () => {
    try {
      const res = await fetch("/api/instances")
      const data = await res.json()
      setInstances(data.instances || [])
    } catch (e) {
      console.error("Failed to fetch instances:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInstances()
  }, [fetchInstances])

  const runningCount = instances.filter((i) => i.status === "running").length
  const stoppedCount = instances.filter((i) => i.status === "stopped").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">实例列表</h1>
          <p className="text-muted-foreground">
            共 {instances.length} 个实例，{runningCount} 运行中，{stoppedCount} 已停止
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchInstances} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
          <Button asChild>
            <Link href="/instances/new">
              <Plus className="mr-1.5 h-4 w-4" />
              新建实例
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : instances.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Server className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">暂无实例</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              创建第一个 Nanobot 实例开始使用
            </p>
            <Button asChild>
              <Link href="/instances/new">
                <Plus className="mr-1.5 h-4 w-4" />
                新建实例
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {instances.map((instance) => (
            <InstanceCard key={instance.id} instance={instance} onRefresh={fetchInstances} />
          ))}
        </div>
      )}
    </div>
  )
}
