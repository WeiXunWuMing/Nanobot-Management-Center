import { NextRequest } from "next/server"
import { db, instances } from "@/lib/db"
import { eq } from "drizzle-orm"
import { getContainer, restartInstance } from "@/lib/docker"
import { readConfig, writeConfig } from "@/lib/profile"

const WEIXIN_QR_SCRIPT = `
import httpx, qrcode, base64, io, json, sys, os
os.environ['PYTHONDONTWRITEBYTECODE'] = '1'
sys.stderr = open(os.devnull, 'w')
try:
    resp = httpx.get("https://ilinkai.weixin.qq.com/ilink/bot/get_bot_qrcode", params={"bot_type": "3"}, timeout=10)
    data = resp.json()
    qr_id = data.get("qrcode", "")
    img_url = data.get("qrcode_img_content", "")
    if not qr_id:
        sys.stdout.write(json.dumps({"error": "no qrcode"}))
    else:
        qr = qrcode.QRCode(border=2, box_size=8)
        qr.add_data(img_url or qr_id)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        b64 = base64.b64encode(buf.getvalue()).decode()
        sys.stdout.write(json.dumps({"status": "ok", "qr_id": qr_id, "image": b64}))
except Exception as e:
    sys.stdout.write(json.dumps({"error": str(e)}))
`

const CHECK_QR_SCRIPT = (qrId: string) => `
import httpx, json, sys, os
os.environ['PYTHONDONTWRITEBYTECODE'] = '1'
sys.stderr = open(os.devnull, 'w')
try:
    resp = httpx.get("https://ilinkai.weixin.qq.com/ilink/bot/get_qrcode_status", params={"qrcode": "${qrId}"}, timeout=10)
    data = resp.json()
    sys.stdout.write(json.dumps(data))
except Exception as e:
    sys.stdout.write(json.dumps({"error": str(e)}))
`

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const instance = db.select().from(instances).where(eq(instances.id, id)).get()
    if (!instance) {
      return Response.json({ error: "实例不存在" }, { status: 404 })
    }

    const container = await getContainer(instance.name)
    if (!container) {
      return Response.json({ error: "容器不存在" }, { status: 404 })
    }

    const info = await container.inspect()
    if (!info.State.Running) {
      return Response.json({ error: "容器未运行，请先启动容器" }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const action = body.action || "generate"

    if (action === "generate") {
      // Generate new QR code
      const result = await execPythonInContainer(container, WEIXIN_QR_SCRIPT)
      if (result.error) {
        return Response.json({ error: result.error }, { status: 500 })
      }
      if (result.status === "ok" && result.image) {
        // Save qr_id to instance for later check
        db.update(instances)
          .set({ description: `qr:${result.qr_id}` })
          .where(eq(instances.id, id))
          .run()

        return Response.json({
          status: "waiting",
          qrImage: result.image,
          qrId: result.qr_id,
          message: "请用微信扫描二维码，然后点击「确认已扫码」按钮",
        })
      }
      return Response.json({ error: "无法生成 QR 码" }, { status: 500 })
    }

    if (action === "check") {
      // Check QR scan status
      const qrIdMatch = instance.description?.match(/^qr:(.+)$/)
      const qrId = qrIdMatch?.[1] || body.qrId

      if (!qrId) {
        return Response.json({ error: "未找到 QR 码 ID，请重新生成" }, { status: 400 })
      }

      const result = await execPythonInContainer(container, CHECK_QR_SCRIPT(qrId))
      if (result.error) {
        return Response.json({ error: result.error }, { status: 500 })
      }

      const status = result.status || ""
      if (status === "confirmed") {
        const token = result.bot_token || ""
        if (token) {
          // Save token to config
          const config = readConfig(instance.name) || {}
          if (!config.channels) config.channels = {}
          if (!config.channels.weixin) config.channels.weixin = {}
          config.channels.weixin.token = token
          config.channels.weixin.enabled = true
          writeConfig(instance.name, config)

          // Clear QR ID from description
          db.update(instances)
            .set({ description: null })
            .where(eq(instances.id, id))
            .run()

          // Restart container to apply new config
          try {
            await restartInstance(instance.name)
          } catch {
            // Ignore restart errors
          }

          return Response.json({
            status: "confirmed",
            message: "登录成功！容器已重启，微信渠道已启用。",
          })
        }
        return Response.json({ status: "confirmed", message: "登录成功" })
      }

      if (status === "expired") {
        return Response.json({
          status: "expired",
          message: "二维码已过期，请重新生成",
        })
      }

      if (status === "scaned_but_redirect") {
        return Response.json({
          status: "scanned",
          message: "已扫码，请在手机上确认登录",
        })
      }

      return Response.json({
        status: "waiting",
        message: "等待扫码...",
      })
    }

    return Response.json({ error: "未知操作" }, { status: 400 })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}

async function execPythonInContainer(container: any, script: string): Promise<any> {
  const exec = await container.exec({
    Cmd: ["python3", "-u", "-c", script],
    AttachStdout: true,
    AttachStderr: false,
    Tty: false,
  })

  const stream = await exec.start({ Detach: false, Tty: false })

  return new Promise((resolve) => {
    let output = ""
    const timeout = setTimeout(() => {
      try { stream.destroy() } catch {}
      resolve({ error: "执行超时" })
    }, 15000)

    stream.on("data", (chunk: Buffer) => {
      output += chunk.toString()
      const jsonMatch = output.match(/\{.*\}/s)
      if (jsonMatch) {
        try {
          const data = JSON.parse(jsonMatch[0])
          clearTimeout(timeout)
          try { stream.destroy() } catch {}
          resolve(data)
          return
        } catch { /* not valid JSON yet */ }
      }
    })

    stream.on("end", () => {
      clearTimeout(timeout)
      const jsonMatch = output.match(/\{.*\}/s)
      if (jsonMatch) {
        try {
          resolve(JSON.parse(jsonMatch[0]))
          return
        } catch { /* parse failed */ }
      }
      resolve({ error: "无法解析输出", raw: output.slice(-500) })
    })

    stream.on("error", (err: Error) => {
      clearTimeout(timeout)
      resolve({ error: String(err) })
    })
  })
}
