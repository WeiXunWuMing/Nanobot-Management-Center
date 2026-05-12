import { getUsedPorts, getUsedWsPorts } from "@/lib/port-allocator"

export async function GET() {
  try {
    const usedPorts = await getUsedPorts()
    const usedWsPorts = await getUsedWsPorts()
    return Response.json({ usedPorts, usedWsPorts })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
