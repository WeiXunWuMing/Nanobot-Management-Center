"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, CheckCircle, XCircle, Server, HardDrive, Cpu } from "lucide-react"

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
    nanobot: number
  }
  images: {
    total: number
    nanobot: boolean
  }
  disk: {
    images: number
    containers: number
    volumes: number
    buildCache: number
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
        containers: { total: 0, running: 0, nanobot: 0 },
        images: { total: 0, nanobot: false },
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
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Docker 版本</p>
                <p className="font-mono font-medium">{info.dockerVersion.version}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">API 版本</p>
                <p className="font-mono font-medium">{info.dockerVersion.apiVersion}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Go 版本</p>
                <p className="font-mono font-medium">{info.dockerVersion.goVersion}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">操作系统</p>
                <p className="font-mono font-medium">
                  {info.dockerVersion.os}/{info.dockerVersion.arch}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">内核版本</p>
                <p className="font-mono font-medium">{info.dockerVersion.kernelVersion}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">平台</p>
                <p className="font-mono font-medium">
                  {info.os}/{info.arch}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {info.dockerAvailable && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              资源概览
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold">{info.containers.total}</p>
                <p className="text-sm text-muted-foreground">总容器</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{info.containers.running}</p>
                <p className="text-sm text-muted-foreground">运行中</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{info.containers.nanobot}</p>
                <p className="text-sm text-muted-foreground">Nanobot</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold">{info.images.total}</p>
                <p className="text-sm text-muted-foreground">总镜像</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                {info.images.nanobot ? (
                  <CheckCircle className="mx-auto h-6 w-6 text-green-500" />
                ) : (
                  <XCircle className="mx-auto h-6 w-6 text-red-500" />
                )}
                <p className="text-sm text-muted-foreground">Nanobot 镜像</p>
              </div>
              {info.disk && (
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold">{info.disk.volumes}</p>
                  <p className="text-sm text-muted-foreground">卷</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
