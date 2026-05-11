import { NextRequest } from "next/server"
import { db, instances } from "@/lib/db"
import { eq } from "drizzle-orm"
import { readWorkspaceFile, writeWorkspaceFile, listWorkspaceFiles } from "@/lib/profile"

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
    const filePath = url.searchParams.get("path")

    if (filePath) {
      const content = readWorkspaceFile(instance.name, filePath)
      if (content === null) {
        return Response.json({ error: "文件不存在" }, { status: 404 })
      }
      return Response.json({ path: filePath, content })
    }

    const files = listWorkspaceFiles(instance.name)
    return Response.json({ files })
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
    const { path: filePath, content } = body as { path: string; content: string }

    if (!filePath) {
      return Response.json({ error: "缺少文件路径" }, { status: 400 })
    }

    writeWorkspaceFile(instance.name, filePath, content)
    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
