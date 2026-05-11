import Dockerode from "dockerode"
import {
  NANOBOT_IMAGE,
  NANOBOT_CONTAINER_PORT,
  CONTAINER_NAME_PREFIX,
  INSTANCE_LABEL_PREFIX,
  INSTANCE_LABEL_NAME,
  INSTANCE_LABEL_PLATFORM,
  PLATFORM_NAME,
  PROFILES_BASE_DIR,
  getDockerSocketPath,
} from "./constants"
import path from "path"
import fs from "fs"

const docker = new Dockerode({ socketPath: getDockerSocketPath() })

let imageEnsured = false

export async function ensureImage(): Promise<void> {
  if (imageEnsured) return

  try {
    await docker.getImage(NANOBOT_IMAGE).inspect()
    imageEnsured = true
    return
  } catch {
    // Image not found, need to build
  }

  console.log(`[nanobot-admin] Image ${NANOBOT_IMAGE} not found, building from PyPI...`)

  const dockerfilePath = path.join(process.cwd(), "nanobot.Dockerfile")
  if (!fs.existsSync(dockerfilePath)) {
    throw new Error(`Dockerfile not found at ${dockerfilePath}`)
  }

  const stream = await docker.buildImage(
    {
      context: process.cwd(),
      src: ["nanobot.Dockerfile"],
    },
    {
      t: NANOBOT_IMAGE,
      dockerfile: "nanobot.Dockerfile",
    }
  )

  await new Promise<void>((resolve, reject) => {
    docker.modem.followProgress(stream, (err: Error | null) => {
      if (err) reject(err)
      else resolve()
    })
  })

  imageEnsured = true
  console.log(`[nanobot-admin] Image ${NANOBOT_IMAGE} built successfully`)
}

export interface CreateContainerOptions {
  name: string
  port: number
  cpuLimit?: number
  memoryLimit?: number
}

export function getContainerName(instanceName: string) {
  return `${CONTAINER_NAME_PREFIX}${instanceName}`
}

export async function createAndStartContainer(opts: CreateContainerOptions): Promise<Dockerode.Container> {
  await ensureImage()

  const containerName = getContainerName(opts.name)
  const profilePath = path.join(PROFILES_BASE_DIR, opts.name)

  const container = await docker.createContainer({
    Image: NANOBOT_IMAGE,
    name: containerName,
    Cmd: ["gateway"],
    ExposedPorts: {
      [`${NANOBOT_CONTAINER_PORT}/tcp`]: {},
    },
    HostConfig: {
      PortBindings: {
        [`${NANOBOT_CONTAINER_PORT}/tcp`]: [{ HostIp: "127.0.0.1", HostPort: String(opts.port) }],
      },
      Binds: [`${profilePath}:/home/nanobot/.nanobot`],
      CapDrop: ["ALL"],
      CapAdd: ["SYS_ADMIN"],
      SecurityOpt: ["apparmor=unconfined", "seccomp=unconfined"],
      RestartPolicy: { Name: "unless-stopped", MaximumRetryCount: 0 },
      NanoCpus: (opts.cpuLimit || 4) * 1e9,
      Memory: (opts.memoryLimit || 8) * 1024 * 1024 * 1024,
      MemoryReservation: 256 * 1024 * 1024,
    },
    Labels: {
      [INSTANCE_LABEL_PREFIX]: "true",
      [INSTANCE_LABEL_NAME]: opts.name,
      [INSTANCE_LABEL_PLATFORM]: PLATFORM_NAME,
    },
  })

  await container.start()
  return container
}

export async function getContainer(instanceName: string) {
  const containerName = getContainerName(instanceName)
  try {
    const containers = await docker.listContainers({ all: true, filters: { name: [containerName] } })
    if (containers.length === 0) return null
    return docker.getContainer(containers[0].Id)
  } catch {
    return null
  }
}

export async function getContainerStatus(instanceName: string): Promise<string> {
  const container = await getContainer(instanceName)
  if (!container) return "removed"
  const info = await container.inspect()
  return info.State.Running ? "running" : info.State.Status === "exited" ? "stopped" : "error"
}

export async function startInstance(instanceName: string) {
  const container = await getContainer(instanceName)
  if (!container) throw new Error("Container not found")
  await container.start()
}

export async function stopInstance(instanceName: string) {
  const container = await getContainer(instanceName)
  if (!container) throw new Error("Container not found")
  await container.stop()
}

export async function restartInstance(instanceName: string) {
  const container = await getContainer(instanceName)
  if (!container) throw new Error("Container not found")
  await container.restart()
}

export async function removeInstance(instanceName: string, removeVolumes = false) {
  const container = await getContainer(instanceName)
  if (!container) return
  try {
    const info = await container.inspect()
    if (info.State.Running) {
      await container.stop()
    }
  } catch {
    // container might already be stopped
  }
  await container.remove({ v: removeVolumes })
}

export async function getContainerLogs(instanceName: string, tail = 100) {
  const container = await getContainer(instanceName)
  if (!container) throw new Error("Container not found")
  const logs = await container.logs({ stdout: true, stderr: true, tail, timestamps: true })
  return logs.toString("utf-8")
}

export async function streamContainerLogs(instanceName: string, tail = 50) {
  const container = await getContainer(instanceName)
  if (!container) throw new Error("Container not found")
  return container.logs({ stdout: true, stderr: true, tail, follow: true, timestamps: true })
}

export async function listManagedContainers() {
  const containers = await docker.listContainers({
    all: true,
    filters: { label: [`${INSTANCE_LABEL_PREFIX}=true`] },
  })
  return containers
}

export async function syncContainerStates(): Promise<Map<string, string>> {
  const containers = await listManagedContainers()
  const stateMap = new Map<string, string>()
  for (const c of containers) {
    const name = c.Labels[INSTANCE_LABEL_NAME]
    if (name) {
      stateMap.set(name, c.State === "running" ? "running" : "stopped")
    }
  }
  return stateMap
}

export async function importExistingContainer(containerId: string) {
  const container = docker.getContainer(containerId)
  const info = await container.inspect()

  const instanceName = info.Name.replace(/^\//, "").replace(CONTAINER_NAME_PREFIX, "")
  const portBinding = info.HostConfig.PortBindings?.[`${NANOBOT_CONTAINER_PORT}/tcp`]
  const port = portBinding?.[0]?.HostPort ? parseInt(portBinding[0].HostPort) : 0

  return {
    name: instanceName,
    containerId: info.Id,
    port,
    status: info.State.Running ? "running" as const : "stopped" as const,
    labels: info.Config.Labels,
  }
}

export { docker }
