import { NextRequest } from "next/server"
import { db, instances, operationLogs } from "@/lib/db"
import { eq } from "drizzle-orm"
import { removeInstance, getContainerStatus } from "@/lib/docker"
import { readConfig, removeProfile } from "@/lib/profile"
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

    let currentStatus: string = instance.status
    let containerExists = true
    try {
      currentStatus = await getContainerStatus(instance.name)
      if (currentStatus === "removed") {
        containerExists = false
        db.delete(instances).where(eq(instances.id, id)).run()
        db.insert(operationLogs)
          .values({
            id: generateId(),
            instanceId: id,
            instanceName: instance.name,
            action: "auto_cleanup",
            detail: `容器已丢失，自动清理记录并释放端口 ${instance.port}`,
            success: true,
          })
          .run()
        return Response.json({ error: "容器已丢失，记录已清理" }, { status: 404 })
      }
      if (currentStatus !== instance.status) {
        db.update(instances)
          .set({ status: currentStatus as "running" | "stopped" | "error" | "creating", updatedAt: new Date().toISOString() })
          .where(eq(instances.id, id))
          .run()
      }
    } catch {
      containerExists = false
    }

    const config = readConfig(instance.name)
    return Response.json({ instance: { ...instance, status: currentStatus, config, containerExists } })
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
    const body = await request.json()
    const { description } = body as { description?: string }

    const instance = db.select().from(instances).where(eq(instances.id, id)).get()
    if (!instance) {
      return Response.json({ error: "实例不存在" }, { status: 404 })
    }

    db.update(instances)
      .set({
        ...(description !== undefined ? { description } : {}),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(instances.id, id))
      .run()

    return Response.json({ instance: db.select().from(instances).where(eq(instances.id, id)).get() })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const instance = db.select().from(instances).where(eq(instances.id, id)).get()
    if (!instance) {
      return Response.json({ error: "实例不存在" }, { status: 404 })
    }

    const url = new URL(request.url)
    const keepProfile = url.searchParams.get("keepProfile") !== "false"

    try {
      await removeInstance(instance.name)
    } catch {
      // Container might already be removed
    }

    if (!keepProfile) {
      removeProfile(instance.name)
    }

    db.delete(instances).where(eq(instances.id, id)).run()

    db.insert(operationLogs)
      .values({
        id: generateId(),
        instanceId: id,
        instanceName: instance.name,
        action: "delete",
        detail: `删除实例 ${instance.name}，保留配置: ${keepProfile}`,
        success: true,
      })
      .run()

    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
