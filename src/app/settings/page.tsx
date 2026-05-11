"use client"

import { EnvironmentCheck } from "@/components/environment-check"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Server, FolderOpen, Database } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">平台设置</h1>
        <p className="text-muted-foreground">管理平台运行配置和环境状态</p>
      </div>

      <EnvironmentCheck />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Profile 目录
          </CardTitle>
          <CardDescription>实例配置和数据存储路径</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Profiles 基础目录</Label>
            <Input value="/opt/1panel/docker/compose/nanobot/profiles" disabled />
            <p className="text-xs text-muted-foreground">
              通过环境变量 PROFILES_DIR 修改
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            数据库
          </CardTitle>
          <CardDescription>管理平台元数据存储</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>数据库文件</Label>
            <Input value="./data/nanobot-admin.db" disabled />
            <p className="text-xs text-muted-foreground">
              SQLite 数据库，通过环境变量 DB_PATH 修改
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>环境变量参考</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm font-mono">
            <div className="flex justify-between rounded bg-muted px-3 py-2">
              <span>DOCKER_SOCKET</span>
              <span className="text-muted-foreground">/var/run/docker.sock</span>
            </div>
            <div className="flex justify-between rounded bg-muted px-3 py-2">
              <span>PROFILES_DIR</span>
              <span className="text-muted-foreground">/opt/1panel/docker/compose/nanobot/profiles</span>
            </div>
            <div className="flex justify-between rounded bg-muted px-3 py-2">
              <span>DB_PATH</span>
              <span className="text-muted-foreground">./data/nanobot-admin.db</span>
            </div>
            <div className="flex justify-between rounded bg-muted px-3 py-2">
              <span>NANOBOT_IMAGE</span>
              <span className="text-muted-foreground">ghcr.io/nanobot-ai/nanobot:latest</span>
            </div>
            <div className="flex justify-between rounded bg-muted px-3 py-2">
              <span>PORT</span>
              <span className="text-muted-foreground">3000</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
