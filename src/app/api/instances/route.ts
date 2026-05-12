import { NextRequest } from "next/server"
import { db, instances, operationLogs } from "@/lib/db"
import { eq } from "drizzle-orm"
import { createAndStartContainer, getContainerStatus, removeInstance } from "@/lib/docker"
import { createProfile, ensureDirectories, readConfig, removeProfile } from "@/lib/profile"
import { allocatePort } from "@/lib/port-allocator"
import { generateId } from "@/lib/utils"

export async function GET() {
  try {
    const allInstances = db.select().from(instances).all()

    const enriched = await Promise.all(
      allInstances.map(async (inst) => {
        let currentStatus: string = inst.status
        let containerExists = true
        try {
          currentStatus = await getContainerStatus(inst.name)
          if (currentStatus === "removed") {
            containerExists = false
            db.delete(instances).where(eq(instances.id, inst.id)).run()
            db.insert(operationLogs)
              .values({
                id: generateId(),
                instanceId: inst.id,
                instanceName: inst.name,
                action: "auto_cleanup",
                detail: `容器已丢失，自动清理记录并释放端口 ${inst.port}`,
                success: true,
              })
              .run()
            return null
          }
          if (currentStatus !== inst.status) {
            db.update(instances)
              .set({
                status: currentStatus as "running" | "stopped" | "error" | "creating",
                updatedAt: new Date().toISOString(),
              })
              .where(eq(instances.id, inst.id))
              .run()
          }
        } catch {
          containerExists = false
        }
        const config = readConfig(inst.name)
        return { ...inst, status: currentStatus, config, containerExists }
      })
    )

    return Response.json({ instances: enriched.filter(Boolean) })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let instanceId: string | null = null
  let instanceName: string | null = null
  let instancePort: number | null = null

  try {
    const body = await request.json()
    const { name, description, config, image } = body as {
      name: string
      description?: string
      config?: Record<string, unknown>
      image?: string
    }

    if (!name || !/^[a-z][a-z0-9-]*$/.test(name)) {
      return Response.json(
        { error: "实例名必须以小写字母开头，只能包含小写字母、数字和连字符" },
        { status: 400 }
      )
    }

    const existing = db.select().from(instances).where(eq(instances.name, name)).get()
    if (existing) {
      return Response.json({ error: "实例名已存在" }, { status: 409 })
    }

    ensureDirectories()
    const port = await allocatePort()
    instanceId = generateId()
    instanceName = name
    instancePort = port

    db.insert(instances)
      .values({
        id: instanceId,
        name,
        port,
        status: "creating",
        description: description || null,
      })
      .run()

    createProfile(name)

    if (config) {
      const { writeConfig } = await import("@/lib/profile")
      writeConfig(name, config)
    }

    const container = await createAndStartContainer({ name, port, image })
    const containerInfo = await container.inspect()

    db.update(instances)
      .set({
        containerId: containerInfo.Id,
        status: "running",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(instances.id, instanceId))
      .run()

    db.insert(operationLogs)
      .values({
        id: generateId(),
        instanceId,
        instanceName: name,
        action: "create",
        detail: `创建实例 ${name}，端口 ${port}`,
        success: true,
      })
      .run()

    const instance = db.select().from(instances).where(eq(instances.id, instanceId)).get()
    return Response.json({ instance }, { status: 201 })
  } catch (error) {
    if (instanceId && instanceName) {
      db.delete(instances).where(eq(instances.id, instanceId)).run()
      db.insert(operationLogs)
        .values({
          id: generateId(),
          instanceId,
          instanceName,
          action: "create_failed",
          detail: `创建失败，已回滚: ${String(error)}`,
          success: false,
        })
        .run()
    }
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
