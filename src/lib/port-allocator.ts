import net from "net"
import { db, instances } from "./db"
import { eq } from "drizzle-orm"
import { PORT_RANGE_START, PORT_RANGE_END, WS_PORT_RANGE_START, WS_PORT_RANGE_END } from "./constants"

export async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.listen(port, "0.0.0.0")
    server.on("listening", () => {
      server.close()
      resolve(true)
    })
    server.on("error", () => {
      resolve(false)
    })
  })
}

export async function getUsedPorts(): Promise<number[]> {
  const rows = db.select({ port: instances.port }).from(instances).all()
  return rows.map((r) => r.port)
}

export async function getUsedWsPorts(): Promise<number[]> {
  const rows = db.select({ wsPort: instances.wsPort }).from(instances).all()
  return rows.filter((r) => r.wsPort !== null).map((r) => r.wsPort as number)
}

export async function allocatePort(): Promise<number> {
  const usedPorts = new Set(await getUsedPorts())

  for (let port = PORT_RANGE_START; port <= PORT_RANGE_END; port++) {
    if (usedPorts.has(port)) continue
    const available = await isPortAvailable(port)
    if (available) return port
  }

  throw new Error("No available ports in range")
}

export async function allocateWsPort(): Promise<number> {
  const usedPorts = new Set(await getUsedWsPorts())

  for (let port = WS_PORT_RANGE_START; port <= WS_PORT_RANGE_END; port++) {
    if (usedPorts.has(port)) continue
    const available = await isPortAvailable(port)
    if (available) return port
  }

  throw new Error("No available WebSocket ports in range")
}

export async function isPortFreeForInstance(port: number, excludeInstanceId?: string): Promise<boolean> {
  const usedByInstance = db
    .select({ id: instances.id })
    .from(instances)
    .where(eq(instances.port, port))
    .get()

  if (usedByInstance && usedByInstance.id !== excludeInstanceId) return false
  return isPortAvailable(port)
}
