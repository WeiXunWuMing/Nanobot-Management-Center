import { NextRequest } from "next/server"
import { db, instances } from "@/lib/db"
import { eq } from "drizzle-orm"
import { installPresetSkill, uninstallSkill } from "@/lib/profile"

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

    const body = await request.json()
    const { skillName } = body as { skillName: string }

    if (!skillName) {
      return Response.json({ error: "缺少 skillName" }, { status: 400 })
    }

    const result = installPresetSkill(instance.name, skillName)
    if (!result.success) {
      return Response.json({ error: result.error }, { status: 400 })
    }

    return Response.json({ success: true, message: `已安装 ${skillName}` })
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
    const skillName = url.searchParams.get("name")

    if (!skillName) {
      return Response.json({ error: "缺少 skill name" }, { status: 400 })
    }

    const result = uninstallSkill(instance.name, skillName)
    if (!result.success) {
      return Response.json({ error: result.error }, { status: 400 })
    }

    return Response.json({ success: true, message: `已卸载 ${skillName}` })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
