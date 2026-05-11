import { NextRequest } from "next/server"
import { db, instances, operationLogs } from "@/lib/db"
import { eq } from "drizzle-orm"
import { readConfig, writeConfig } from "@/lib/profile"
import { generateId } from "@/lib/utils"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const instance = db.select().from(instances).where(eq(instances.id, id)).get()
    if (!instance) {
      return Response.json({ error: "实例不存在" }, { status: 404 })
    }

    const config = readConfig(instance.name)
    return Response.json({ config })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const instance = db.select().from(instances).where(eq(instances.id, id)).get()
    if (!instance) {
      return Response.json({ error: "实例不存在" }, { status: 404 })
    }

    const body = await request.json()
    const { config } = body as { config: Record<string, unknown> }

    if (!config || typeof config !== "object") {
      return Response.json({ error: "无效的配置" }, { status: 400 })
    }

    writeConfig(instance.name, config)

    db.update(instances)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(instances.id, id))
      .run()

    db.insert(operationLogs)
      .values({
        id: generateId(),
        instanceId: id,
        instanceName: instance.name,
        action: "config_update",
        detail: `更新配置`,
        success: true,
      })
      .run()

    return Response.json({ success: true, config: readConfig(instance.name) })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
