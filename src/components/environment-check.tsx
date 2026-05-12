"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Server,
  HardDrive,
  Cpu,
  Container,
  Image,
  Activity,
} from "lucide-react"

interface EnvironmentInfo {
  dockerAvailable: boolean
  dockerVersion: {
    version: string
    apiVersion: string
    goVersion: string
    os: string
    arch: string
    kernelVersion: string
  } | null
  os: string
  arch: string
  socketPath: string
  containers: {
    total: number
    running: number
    stopped: number
    nanobot: number
    list: Array<{
      id: string
      name: string
      state: string
      status: string
      image: string
      ports: string[]
      createdAt: string
    }>
  }
  images: {
    total: number
    nanobotFound: boolean
    list: Array<{
      id: string
      tags: string[]
      size: string
      sizeBytes: number
      createdAt: string
    }>
  }
  disk: {
    images: { count: number; size: string; sizeBytes: number }
    containers: { count: number; size: string; sizeBytes: number }
    volumes: { count: number; size: string; sizeBytes: number }
    buildCache: { count: number; size: string; sizeBytes: number }
    totalSize: string
  } | null
  errors: string[]
}

export function EnvironmentCheck() {
  const [info, setInfo] = useState<EnvironmentInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchInfo = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/environment")
      const data = await res.json()
      setInfo(data)
    } catch (e) {
      setInfo({
        dockerAvailable: false,
        dockerVersion: null,
        os: process.platform,
        arch: process.arch,
        socketPath: "",
        containers: { total: 0, running: 0, stopped: 0, nanobot: 0, list: [] },
        images: { total: 0, nanobotFound: false, list: [] },
        disk: null,
        errors: [`获取环境信息失败: ${String(e)}`],
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInfo()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!info) return null

  return (
    <div className="space-y-4">
      {/* Docker Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Docker 环境
              </CardTitle>
              <CardDescription>Docker 连接状态和版本信息</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchInfo}>
              <RefreshCw className="mr-1 h-4 w-4" />
              刷新
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              {info.dockerAvailable ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <div>
                <p className="font-medium">
                  {info.dockerAvailable ? "Docker 已连接" : "Docker 未连接"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Socket: {info.socketPath}
                </p>
              </div>
            </div>
            <Badge variant={info.dockerAvailable ? "default" : "destructive"}>
              {info.dockerAvailable ? "可用" : "不可用"}
            </Badge>
          </div>

          {info.dockerVersion && (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Docker 版本</p>
                <p className="font-mono text-sm font-medium">{info.dockerVersion.version}</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">API 版本</p>
                <p className="font-mono text-sm font-medium">{info.dockerVersion.apiVersion}</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">系统</p>
                <p className="font-mono text-sm font-medium">
                  {info.dockerVersion.os}/{info.dockerVersion.arch}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resource Overview */}
      {info.dockerAvailable && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              资源概览
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Container className="h-4 w-4" />
                  <span className="text-xs">容器</span>
                </div>
                <p className="mt-1 text-2xl font-bold">{info.containers.total}</p>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{info.containers.running} 运行</span>
                  {" · "}
                  <span className="text-gray-500">{info.containers.stopped} 停止</span>
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Image className="h-4 w-4" />
                  <span className="text-xs">镜像</span>
                </div>
                <p className="mt-1 text-2xl font-bold">{info.images.total}</p>
                <p className="text-xs text-muted-foreground">
                  {info.images.nanobotFound ? (
                    <span className="text-green-600">✓ nanobot 镜像</span>
                  ) : (
                    <span className="text-orange-500">未找到 nanobot 镜像</span>
                  )}
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <HardDrive className="h-4 w-4" />
                  <span className="text-xs">存储</span>
                </div>
                <p className="mt-1 text-2xl font-bold">
                  {info.disk?.totalSize || "N/A"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {info.disk ? `${info.disk.volumes.count} 卷` : "无磁盘信息"}
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Cpu className="h-4 w-4" />
                  <span className="text-xs">Nanobot</span>
                </div>
                <p className="mt-1 text-2xl font-bold">{info.containers.nanobot}</p>
                <p className="text-xs text-muted-foreground">管理的实例</p>
              </div>
            </div>

            {info.disk && (
              <div className="mt-4 rounded-lg border p-4">
                <p className="mb-3 text-sm font-medium">磁盘使用详情</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">镜像 ({info.disk.images.count})</span>
                    <span className="font-mono">{info.disk.images.size}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">容器 ({info.disk.containers.count})</span>
                    <span className="font-mono">{info.disk.containers.size}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">卷 ({info.disk.volumes.count})</span>
                    <span className="font-mono">{info.disk.volumes.size}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">构建缓存 ({info.disk.buildCache.count})</span>
                    <span className="font-mono">{info.disk.buildCache.size}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span>总计</span>
                      <span className="font-mono">{info.disk.totalSize}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Container List */}
      {info.dockerAvailable && info.containers.list.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Container className="h-5 w-5" />
              容器列表
            </CardTitle>
            <CardDescription>
              {info.containers.running} 运行中 / {info.containers.total} 总计
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {info.containers.list.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        c.state === "running" ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                    <div>
                      <p className="font-mono text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.image} · {c.ports.join(", ") || "无端口映射"}
                      </p>
                    </div>
                  </div>
                  <Badge variant={c.state === "running" ? "default" : "secondary"}>
                    {c.state}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Errors */}
      {info.errors.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              错误信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {info.errors.map((error, i) => (
                <li key={i} className="rounded bg-destructive/10 p-2 text-sm text-destructive">
                  {error}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
