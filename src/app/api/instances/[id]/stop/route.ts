import { db, instances, operationLogs } from "@/lib/db"
import { eq } from "drizzle-orm"
import { stopInstance } from "@/lib/docker"
import { generateId } from "@/lib/utils"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const instance = db.select().from(instances).where(eq(instances.id, id)).get()
    if (!instance) {
      return Response.json({ error: "实例不存在" }, { status: 404 })
    }

    await stopInstance(instance.name)

    db.update(instances)
      .set({ status: "stopped", updatedAt: new Date().toISOString() })
      .where(eq(instances.id, id))
      .run()

    db.insert(operationLogs)
      .values({
        id: generateId(),
        instanceId: id,
        instanceName: instance.name,
        action: "stop",
        detail: `停止实例 ${instance.name}`,
        success: true,
      })
      .run()

    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
