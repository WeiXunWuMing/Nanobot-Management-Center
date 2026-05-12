import { NextRequest } from "next/server"
import { db, instances, operationLogs } from "@/lib/db"
import { eq } from "drizzle-orm"
import { removeInstance, createAndStartContainer } from "@/lib/docker"
import { readConfig } from "@/lib/profile"
import { generateId } from "@/lib/utils"

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

    // Stop and remove existing container
    try {
      await removeInstance(instance.name)
    } catch {
      // Container might not exist
    }

    // Read existing config
    const config = readConfig(instance.name)

    // Create new container (always allocate wsPort if not exists)
    const container = await createAndStartContainer({
      name: instance.name,
      port: instance.port,
      wsPort: instance.wsPort || undefined,
    })
    const containerInfo = await container.inspect()

    // Get the allocated wsPort from container port bindings
    const portBindings = containerInfo.HostConfig?.PortBindings || {}
    const wsPortBinding = portBindings[`${8765}/tcp`]
    const allocatedWsPort = wsPortBinding?.[0]?.HostPort ? parseInt(wsPortBinding[0].HostPort) : instance.wsPort

    // Update database with new container ID and wsPort
    db.update(instances)
      .set({
        containerId: containerInfo.Id,
        wsPort: allocatedWsPort,
        status: "running",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(instances.id, id))
      .run()

    // Log operation
    db.insert(operationLogs)
      .values({
        id: generateId(),
        instanceId: id,
        instanceName: instance.name,
        action: "rebuild",
        detail: `重建实例 ${instance.name}，新容器 ${containerInfo.Id.slice(0, 12)}，WebSocket 端口 ${allocatedWsPort}`,
        success: true,
      })
      .run()

    return Response.json({
      success: true,
      containerId: containerInfo.Id,
      wsPort: allocatedWsPort,
      message: "实例重建成功",
    })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
