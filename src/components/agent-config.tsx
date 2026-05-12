"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PROVIDERS } from "@/lib/config-schema"

interface AgentConfigProps {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export function AgentConfig({ config, onChange }: AgentConfigProps) {
  const agents = (config.agents as Record<string, unknown>) || {}
  const defaults = (agents.defaults as Record<string, unknown>) || {}
  const providers = (config.providers as Record<string, Record<string, unknown>>) || {}
  const gateway = (config.gateway as Record<string, unknown>) || {}

  const currentModel = (defaults.model as string) || ""
  const currentProvider = (defaults.provider as string) || "auto"
  const currentTemp = (defaults.temperature as number) ?? 0.1
  const currentMaxTokens = (defaults.maxTokens as number) ?? 8192
  const currentContextWindow = (defaults.contextWindowTokens as number) ?? 65536
  const currentMaxIterations = (defaults.maxToolIterations as number) ?? 200
  const currentTimezone = (defaults.timezone as string) || "Asia/Shanghai"
  const currentWorkspace = (defaults.workspace as string) || "~/.nanobot/workspace"

  const detectedProvider = detectProvider(currentModel, currentProvider, providers)
  const apiKey = providers[detectedProvider]?.apiKey as string || ""

  function updateField(section: string, key: string, value: unknown) {
    const newConfig = JSON.parse(JSON.stringify(config))
    if (!newConfig[section]) newConfig[section] = {}
    if (typeof key === "string" && key.includes(".")) {
      const parts = key.split(".")
      let obj = newConfig[section]
      for (let i = 0; i < parts.length - 1; i++) {
        if (!obj[parts[i]]) obj[parts[i]] = {}
        obj = obj[parts[i]]
      }
      obj[parts[parts.length - 1]] = value
    } else {
      newConfig[section][key] = value
    }
    onChange(newConfig)
  }

  function updateProviderKey(provider: string, key: string) {
    const newConfig = JSON.parse(JSON.stringify(config))
    if (!newConfig.providers) newConfig.providers = {}
    if (!newConfig.providers[provider]) newConfig.providers[provider] = {}
    newConfig.providers[provider].apiKey = key
    onChange(newConfig)
  }

  const selectedProvider = PROVIDERS.find((p) => p.name === detectedProvider)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>模型配置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select
              value={detectedProvider}
              onValueChange={(v) => {
                updateField("agents", "defaults.provider", v)
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">自动检测</SelectItem>
                {PROVIDERS.map((p) => (
                  <SelectItem key={p.name} value={p.name}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>模型名称</Label>
            <Input
              value={currentModel}
              onChange={(e) => updateField("agents", "defaults.model", e.target.value)}
              placeholder={selectedProvider?.modelPlaceholder || "例如: claude-sonnet-4-20250514"}
            />
            <p className="text-xs text-muted-foreground">
              直接填写模型名称，如 deepseek-v4-flash、gpt-4o、claude-sonnet-4-20250514。系统会根据 Provider 自动匹配。
            </p>
          </div>

          <div className="space-y-2">
            <Label>API Key</Label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => updateProviderKey(detectedProvider, e.target.value)}
              placeholder={`${selectedProvider?.label || ""} API Key`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>温度</Label>
              <Input
                type="number"
                min={0}
                max={2}
                step={0.1}
                value={currentTemp}
                onChange={(e) => updateField("agents", "defaults.temperature", parseFloat(e.target.value) || 0.1)}
              />
            </div>
            <div className="space-y-2">
              <Label>最大 Tokens</Label>
              <Input
                type="number"
                min={1}
                max={200000}
                value={currentMaxTokens}
                onChange={(e) => updateField("agents", "defaults.maxTokens", parseInt(e.target.value) || 8192)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>上下文窗口 Tokens</Label>
              <Input
                type="number"
                min={1024}
                max={1000000}
                value={currentContextWindow}
                onChange={(e) => updateField("agents", "defaults.contextWindowTokens", parseInt(e.target.value) || 65536)}
              />
            </div>
            <div className="space-y-2">
              <Label>最大工具迭代次数</Label>
              <Input
                type="number"
                min={1}
                max={1000}
                value={currentMaxIterations}
                onChange={(e) => updateField("agents", "defaults.maxToolIterations", parseInt(e.target.value) || 200)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>工作目录</Label>
            <Input
              value={currentWorkspace}
              onChange={(e) => updateField("agents", "defaults.workspace", e.target.value)}
              placeholder="~/.nanobot/workspace"
            />
          </div>

          <div className="space-y-2">
            <Label>时区</Label>
            <Select
              value={currentTimezone}
              onValueChange={(v) => updateField("agents", "defaults.timezone", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Asia/Shanghai">Asia/Shanghai (中国)</SelectItem>
                <SelectItem value="Asia/Tokyo">Asia/Tokyo (日本)</SelectItem>
                <SelectItem value="America/New_York">America/New_York (美东)</SelectItem>
                <SelectItem value="America/Los_Angeles">America/Los_Angeles (美西)</SelectItem>
                <SelectItem value="Europe/London">Europe/London (英国)</SelectItem>
                <SelectItem value="UTC">UTC</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gateway 配置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>主机</Label>
              <Input
                value={(gateway.host as string) || "0.0.0.0"}
                onChange={(e) => updateField("gateway", "host", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>端口</Label>
              <Input
                type="number"
                value={(gateway.port as number) || 18790}
                onChange={(e) => updateField("gateway", "port", parseInt(e.target.value) || 18790)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function detectProvider(model: string, provider: string, providers: Record<string, Record<string, unknown>>): string {
  if (provider && provider !== "auto") return provider
  if (model) {
    const prefix = model.split("/")[0]
    if (providers[prefix]) return prefix
    for (const [name, cfg] of Object.entries(providers)) {
      if (cfg.apiKey) return name
    }
  }
  for (const [name, cfg] of Object.entries(providers)) {
    if (cfg.apiKey) return name
  }
  return "anthropic"
}
