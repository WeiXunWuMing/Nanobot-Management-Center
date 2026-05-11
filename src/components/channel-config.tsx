"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, QrCode, Wifi, WifiOff, CheckCircle } from "lucide-react"

interface ChannelConfigProps {
  instanceId: string
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

interface QrState {
  loading: boolean
  qrImage: string
  qrId: string
  status: string
  message: string
}

const CHANNEL_DEFS = [
  { name: "weixin", label: "微信", icon: "💬", fields: [] },
  { name: "telegram", label: "Telegram", icon: "✈️", fields: [{ key: "token", label: "Bot Token", type: "password" }] },
  { name: "discord", label: "Discord", icon: "🎮", fields: [{ key: "token", label: "Bot Token", type: "password" }] },
  { name: "slack", label: "Slack", icon: "💼", fields: [{ key: "token", label: "Bot Token", type: "password" }, { key: "appToken", label: "App Token", type: "password" }, { key: "signingSecret", label: "Signing Secret", type: "password" }] },
  { name: "feishu", label: "飞书", icon: "🐦", fields: [{ key: "appId", label: "App ID", type: "text" }, { key: "appSecret", label: "App Secret", type: "password" }] },
  { name: "dingtalk", label: "钉钉", icon: "📌", fields: [{ key: "appKey", label: "App Key", type: "text" }, { key: "appSecret", label: "App Secret", type: "password" }] },
  { name: "wecom", label: "企业微信", icon: "🏢", fields: [{ key: "botId", label: "Bot ID", type: "text" }, { key: "secret", label: "Secret", type: "password" }] },
]

export function ChannelConfig({ instanceId, config, onChange }: ChannelConfigProps) {
  const channels = (config.channels as Record<string, Record<string, unknown>>) || {}
  const [qrState, setQrState] = useState<QrState>({
    loading: false,
    qrImage: "",
    qrId: "",
    status: "",
    message: "",
  })
  const [manualToken, setManualToken] = useState("")
  const [showManualInput, setShowManualInput] = useState(false)

  function toggleChannel(name: string, enabled: boolean) {
    const newConfig = JSON.parse(JSON.stringify(config))
    if (!newConfig.channels) newConfig.channels = {}
    if (!newConfig.channels[name]) newConfig.channels[name] = {}
    newConfig.channels[name].enabled = enabled
    // Add allowFrom for weixin channel
    if (name === "weixin" && enabled) {
      newConfig.channels[name].allowFrom = ["*"]
    }
    onChange(newConfig)
  }

  function updateChannelField(name: string, key: string, value: string) {
    const newConfig = JSON.parse(JSON.stringify(config))
    if (!newConfig.channels) newConfig.channels = {}
    if (!newConfig.channels[name]) newConfig.channels[name] = {}
    newConfig.channels[name][key] = value
    onChange(newConfig)
  }

  const generateQrCode = useCallback(async () => {
    setQrState({ loading: true, qrImage: "", qrId: "", status: "connecting", message: "正在生成二维码..." })

    try {
      const res = await fetch(`/api/instances/${instanceId}/channels/weixin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      })
      const data = await res.json()

      if (!res.ok) {
        setQrState({ loading: false, qrImage: "", qrId: "", status: "error", message: data.error || "生成失败" })
        return
      }

      if (data.status === "waiting" && data.qrImage) {
        setQrState({
          loading: false,
          qrImage: data.qrImage,
          qrId: data.qrId,
          status: "waiting",
          message: data.message || "请用微信扫描二维码",
        })
      }
    } catch (e) {
      setQrState({ loading: false, qrImage: "", qrId: "", status: "error", message: String(e) })
    }
  }, [instanceId])

  const checkQrStatus = useCallback(async () => {
    setQrState((prev) => ({ ...prev, loading: true, message: "正在检查扫码状态..." }))

    try {
      const res = await fetch(`/api/instances/${instanceId}/channels/weixin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check" }),
      })
      const data = await res.json()

      if (data.status === "confirmed") {
        setQrState({
          loading: false,
          qrImage: "",
          qrId: "",
          status: "confirmed",
          message: data.message || "登录成功！",
        })
      } else if (data.status === "expired") {
        setQrState((prev) => ({
          ...prev,
          loading: false,
          status: "expired",
          message: data.message || "二维码已过期",
        }))
      } else if (data.status === "scanned") {
        setQrState((prev) => ({
          ...prev,
          loading: false,
          status: "scanned",
          message: data.message || "已扫码，请在手机上确认",
        }))
      } else {
        setQrState((prev) => ({
          ...prev,
          loading: false,
          status: "waiting",
          message: data.message || "等待扫码...",
        }))
      }
    } catch (e) {
      setQrState((prev) => ({ ...prev, loading: false, message: String(e) }))
    }
  }, [instanceId])

  const saveManualToken = useCallback(() => {
    if (!manualToken.trim()) return
    const newConfig = JSON.parse(JSON.stringify(config))
    if (!newConfig.channels) newConfig.channels = {}
    if (!newConfig.channels.weixin) newConfig.channels.weixin = {}
    newConfig.channels.weixin.token = manualToken.trim()
    newConfig.channels.weixin.enabled = true
    newConfig.channels.weixin.allowFrom = ["*"]
    onChange(newConfig)
    setManualToken("")
    setShowManualInput(false)
  }, [config, manualToken, onChange])

  return (
    <div className="space-y-4">
      {CHANNEL_DEFS.map((chDef) => {
        const chConfig = channels[chDef.name] || {}
        const isEnabled = chConfig.enabled === true

        return (
          <Card key={chDef.name}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{chDef.icon}</span>
                  <CardTitle className="text-base">{chDef.label}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  {isEnabled ? (
                    <Badge className="bg-green-600 text-white">已启用</Badge>
                  ) : (
                    <Badge variant="secondary">未启用</Badge>
                  )}
                  <Button
                    size="sm"
                    variant={isEnabled ? "destructive" : "default"}
                    onClick={() => toggleChannel(chDef.name, !isEnabled)}
                  >
                    {isEnabled ? "禁用" : "启用"}
                  </Button>
                </div>
              </div>
            </CardHeader>

            {isEnabled && (
              <CardContent className="space-y-3">
                {chDef.fields.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <Label className="text-xs">{field.label}</Label>
                    <Input
                      type={field.type}
                      value={(chConfig[field.key] as string) || ""}
                      onChange={(e) => updateChannelField(chDef.name, field.key, e.target.value)}
                      placeholder={field.label}
                    />
                  </div>
                ))}

                {chDef.name === "weixin" && (
                  <div className="mt-4 rounded-lg border p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <QrCode className="h-4 w-4" />
                      <span className="text-sm font-medium">微信登录</span>
                    </div>

                    {qrState.status === "confirmed" ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">{qrState.message}</span>
                      </div>
                    ) : qrState.qrImage ? (
                      <div className="space-y-3">
                        <div className="flex justify-center">
                          <img
                            src={`data:image/png;base64,${qrState.qrImage}`}
                            alt="微信登录二维码"
                            className="h-48 w-48 rounded border"
                          />
                        </div>
                        <p className="text-center text-sm text-muted-foreground">{qrState.message}</p>
                        <div className="flex justify-center gap-2">
                          <Button size="sm" onClick={checkQrStatus} disabled={qrState.loading}>
                            {qrState.loading ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle className="mr-1 h-3 w-3" />
                            )}
                            确认已扫码
                          </Button>
                          <Button size="sm" variant="outline" onClick={generateQrCode}>
                            刷新二维码
                          </Button>
                        </div>
                        {qrState.status === "scanned" && (
                          <p className="text-center text-sm text-orange-600">
                            已扫码，请在手机上确认登录
                          </p>
                        )}
                        {qrState.status === "expired" && (
                          <p className="text-center text-sm text-destructive">
                            二维码已过期，请点击刷新
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          点击按钮生成登录二维码
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={generateQrCode}
                            disabled={qrState.loading}
                          >
                            {qrState.loading ? (
                              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <QrCode className="mr-1 h-3.5 w-3.5" />
                            )}
                            生成二维码
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowManualInput(!showManualInput)}
                          >
                            手动输入 Token
                          </Button>
                        </div>
                        {qrState.status === "error" && (
                          <p className="text-sm text-destructive">{qrState.message}</p>
                        )}
                      </div>
                    )}

                    {showManualInput && (
                      <div className="mt-3 space-y-2 rounded border-t pt-3">
                        <Label className="text-xs">手动输入 Token</Label>
                        <div className="flex gap-2">
                          <Input
                            type="password"
                            value={manualToken}
                            onChange={(e) => setManualToken(e.target.value)}
                            placeholder="输入微信 Bot Token"
                          />
                          <Button size="sm" onClick={saveManualToken} disabled={!manualToken.trim()}>
                            保存
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          如果扫码登录失败，可以手动输入已获取的 Token
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
