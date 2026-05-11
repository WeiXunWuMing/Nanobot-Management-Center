import { NextRequest } from "next/server"
import { db, instances } from "@/lib/db"
import { eq } from "drizzle-orm"
import { getContainerLogs } from "@/lib/docker"

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

    const url = new URL(request.url)
    const tail = parseInt(url.searchParams.get("tail") || "200")

    const logs = await getContainerLogs(instance.name, tail)
    return Response.json({ logs })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
