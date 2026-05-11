"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, RefreshCw, Download, Loader2, Search } from "lucide-react"

export default function LogsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [logs, setLogs] = useState("")
  const [loading, setLoading] = useState(true)
  const [instanceName, setInstanceName] = useState("")
  const [search, setSearch] = useState("")
  const [autoScroll, setAutoScroll] = useState(true)
  const logRef = useRef<HTMLPreElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`/api/instances/${id}/logs?tail=500`)
      const data = await res.json()
      if (data.logs !== undefined) {
        setLogs(data.logs)
      }
      if (!instanceName) {
        const instRes = await fetch(`/api/instances/${id}`)
        const instData = await instRes.json()
        if (instData.instance) {
          setInstanceName(instData.instance.name)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [id, instanceName])

  useEffect(() => {
    fetchLogs()
    intervalRef.current = setInterval(fetchLogs, 5000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchLogs])

  useEffect(() => {
    if (autoScroll && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [logs, autoScroll])

  function handleDownload() {
    const blob = new Blob([logs], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${instanceName || id}-logs.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredLogs = search
    ? logs
        .split("\n")
        .filter((line) => line.toLowerCase().includes(search.toLowerCase()))
        .join("\n")
    : logs

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">实例日志</h1>
          <p className="text-muted-foreground">
            {instanceName ? `${instanceName} · ` : ""}每 5 秒自动刷新
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索日志..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-48"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setAutoScroll(!autoScroll)}>
            {autoScroll ? "暂停滚动" : "自动滚动"}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="mr-1.5 h-4 w-4" />
            下载
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <pre
            ref={logRef}
            className="max-h-[calc(100vh-240px)] overflow-auto p-4 font-mono text-xs leading-relaxed"
          >
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLogs ? (
              filteredLogs
            ) : (
              <span className="text-muted-foreground">暂无日志</span>
            )}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
