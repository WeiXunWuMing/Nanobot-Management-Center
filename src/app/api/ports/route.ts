import { getUsedPorts, isPortAvailable } from "@/lib/port-allocator"

export async function GET() {
  try {
    const usedPorts = await getUsedPorts()
    return Response.json({ usedPorts })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
