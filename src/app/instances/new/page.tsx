"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, ArrowRight, Check, Loader2, Server } from "lucide-react"
import { PROVIDERS, CHANNELS } from "@/lib/config-schema"

export default function NewInstancePage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [nextPort, setNextPort] = useState<number>(18790)

  const [form, setForm] = useState({
    name: "",
    description: "",
    port: 0,
    provider: "anthropic",
    apiKey: "",
    model: "",
    installPlaywright: false,
    installPatched: false,
    channels: {} as Record<string, Record<string, string>>,
  })

  useEffect(() => {
    fetch("/api/ports")
      .then((r) => r.json())
      .then((data) => {
        const used = new Set(data.usedPorts || [])
        for (let p = 18790; p <= 18890; p++) {
          if (!used.has(p)) {
            setNextPort(p)
            setForm((f) => ({ ...f, port: p }))
            break
          }
        }
      })
  }, [])

  function updateForm(key: string, value: unknown) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function updateChannel(channel: string, field: string, value: string) {
    setForm((f) => ({
      ...f,
      channels: {
        ...f.channels,
        [channel]: { ...(f.channels[channel] || {}), [field]: value },
      },
    }))
  }

  function buildConfig() {
    const providerConfig: Record<string, unknown> = {}
    if (form.apiKey) {
      providerConfig[form.provider] = { apiKey: form.apiKey }
    }

    const channelsConfig: Record<string, unknown> = {}
    for (const [ch, fields] of Object.entries(form.channels)) {
      if (Object.values(fields).some((v) => v)) {
        channelsConfig[ch] = fields
      }
    }

    const config: Record<string, unknown> = {
      agents: {
        defaults: {
          model: form.model || "",
          provider: form.provider,
          workspace: "~/.nanobot/workspace",
          maxTokens: 8192,
          contextWindowTokens: 65536,
          temperature: 0.1,
          maxToolIterations: 200,
          timezone: "Asia/Shanghai",
        },
      },
      channels: {},
      providers: {
        [form.provider]: {
          apiKey: form.apiKey || "",
        },
      },
      tools: {
        web: {
          enable: true,
          search: {
            provider: "duckduckgo",
            maxResults: 5,
            timeout: 30,
          },
          fetch: {
            useJinaReader: true,
          },
        },
        exec: {
          enable: true,
          timeout: 60,
        },
        my: {
          enable: true,
          allowSet: false,
        },
        imageGeneration: {
          enabled: false,
        },
        mcpServers: {},
      },
      gateway: {
        host: "0.0.0.0",
        port: 18790,
      },
      api: {
        host: "127.0.0.1",
        port: 8900,
        timeout: 120,
      },
    }

    if (Object.keys(channelsConfig).length > 0) {
      config.channels = channelsConfig
    }

    return config
  }

  async function handleCreate() {
    setLoading(true)
    setError("")
    try {
      const config = buildConfig()
      
      // Determine which image to use
      let image: string | undefined
      if (form.installPlaywright && form.installPatched) {
        // Both options: need to build a combined image
        // For now, use patched (message splitting is more commonly needed)
        image = "nanobot:patched"
        setError("提示：Playwright 和多消息拆分暂不支持同时启用，已选择多消息拆分。如需 Playwright，请取消勾选多消息拆分。")
        setLoading(false)
        return
      } else if (form.installPlaywright) {
        image = "nanobot:playwright"
      } else if (form.installPatched) {
        image = "nanobot:patched"
      }
      
      const res = await fetch("/api/instances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          config,
          image,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "创建失败")
        return
      }
      router.push("/instances")
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { title: "基础信息", description: "实例名称和端口" },
    { title: "模型配置", description: "LLM Provider 和模型" },
    { title: "渠道配置", description: "通信渠道（可选）" },
    { title: "确认创建", description: "检查配置并创建" },
  ]

  const selectedProvider = PROVIDERS.find((p) => p.name === form.provider)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">新建实例</h1>
          <p className="text-muted-foreground">创建一个新的 Nanobot 实例</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                i < step
                  ? "bg-primary text-primary-foreground"
                  : i === step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`mx-2 h-px w-8 ${i < step ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{steps[0].title}</CardTitle>
            <CardDescription>{steps[0].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">实例名称 *</Label>
              <Input
                id="name"
                placeholder="例如: titan, guoguo, my-bot"
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              />
              <p className="text-xs text-muted-foreground">
                小写字母开头，只能包含小写字母、数字和连字符。用于容器名和配置目录名。
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                placeholder="可选，实例用途描述"
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">端口</Label>
              <Input
                id="port"
                type="number"
                value={form.port || ""}
                onChange={(e) => updateForm("port", parseInt(e.target.value) || 0)}
                min={18790}
                max={18890}
              />
              <p className="text-xs text-muted-foreground">
                宿主机映射端口，自动分配可用端口，也可手动修改。
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <input
                type="checkbox"
                id="playwright"
                checked={form.installPlaywright}
                onChange={(e) => updateForm("installPlaywright", e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300"
              />
              <div>
                <Label htmlFor="playwright" className="cursor-pointer">
                  预装 Playwright (浏览器自动化)
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  支持截图、表单填写、页面交互。镜像体积增加约 400MB，首次构建需要几分钟。
                  不勾选则使用基础镜像，浏览器相关 Skill 会自动降级为 web_fetch/web_search。
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <input
                type="checkbox"
                id="patched"
                checked={form.installPatched}
                onChange={(e) => updateForm("installPatched", e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300"
              />
              <div>
                <Label htmlFor="patched" className="cursor-pointer">
                  启用多消息拆分
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Bot 回复多条短消息时，每条单独发送而不是合并成一条。适合模拟真人聊天风格。
                  不勾选则长回复会合并成一条消息。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{steps[1].title}</CardTitle>
            <CardDescription>{steps[1].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>LLM Provider</Label>
              <Select value={form.provider} onValueChange={(v) => updateForm("provider", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.name} value={p.name}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder={`${selectedProvider?.label || ""} API Key`}
                value={form.apiKey}
                onChange={(e) => updateForm("apiKey", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                API Key 会存储在实例的 config.json 中，支持 ${"{VAR}"} 语法引用环境变量。
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">模型名称</Label>
              <Input
                id="model"
                placeholder={selectedProvider?.modelPlaceholder || "模型名称"}
                value={form.model}
                onChange={(e) => updateForm("model", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                留空将使用 Provider 默认模型。
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>{steps[2].title}</CardTitle>
            <CardDescription>
              {steps[2].description}。留空表示不启用该渠道。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {CHANNELS.map((ch) => (
              <div key={ch.name}>
                <h4 className="mb-3 text-sm font-medium">{ch.label}</h4>
                <div className="space-y-2">
                  {ch.fields.map((field) => (
                    <div key={field}>
                      <Label htmlFor={`${ch.name}-${field}`} className="text-xs">
                        {field}
                      </Label>
                      <Input
                        id={`${ch.name}-${field}`}
                        type={field.includes("secret") || field.includes("token") || field.includes("key") || field.includes("Key") ? "password" : "text"}
                        placeholder={`${ch.label} ${field}`}
                        value={form.channels[ch.name]?.[field] || ""}
                        onChange={(e) => updateChannel(ch.name, field, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
                <Separator className="mt-4" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>{steps[3].title}</CardTitle>
            <CardDescription>确认以下信息无误后点击创建</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">实例名称</span>
                <p className="font-mono font-medium">{form.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">端口</span>
                <p className="font-mono font-medium">{form.port}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Provider</span>
                <p className="font-medium">{selectedProvider?.label}</p>
              </div>
              <div>
                <span className="text-muted-foreground">模型</span>
                <p className="font-mono font-medium">{form.model || "(默认)"}</p>
              </div>
              {form.description && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">描述</span>
                  <p>{form.description}</p>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-xs">生成的 config.json 预览</Label>
              <pre className="max-h-64 overflow-auto rounded-lg bg-muted p-4 text-xs">
                {JSON.stringify(buildConfig(), null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          上一步
        </Button>
        {step < 3 ? (
          <Button
            onClick={() => setStep((s) => Math.min(3, s + 1))}
            disabled={step === 0 && !form.name}
          >
            下一步
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleCreate} disabled={loading || !form.name}>
            {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Server className="mr-1.5 h-4 w-4" />}
            创建实例
          </Button>
        )}
      </div>
    </div>
  )
}
