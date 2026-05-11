import { docker } from "@/lib/docker"

export async function GET() {
  try {
    const info: Record<string, unknown> = {
      dockerAvailable: false,
      dockerVersion: null,
      os: process.platform,
      arch: process.arch,
      socketPath: getSocketPath(),
      containers: { total: 0, running: 0, nanobot: 0 },
      images: { total: 0, nanobot: false },
      disk: null,
      errors: [],
    }

    // Test Docker connection
    try {
      const version = await docker.version()
      info.dockerAvailable = true
      info.dockerVersion = {
        version: version.Version,
        apiVersion: version.ApiVersion,
        minApiVersion: version.MinAPIVersion,
        goVersion: version.GoVersion,
        os: version.Os,
        arch: version.Arch,
        kernelVersion: version.KernelVersion,
      }
    } catch (e) {
      info.errors.push(`Docker 连接失败: ${String(e)}`)
      return Response.json(info)
    }

    // List containers
    try {
      const allContainers = await docker.listContainers({ all: true })
      info.containers = {
        total: allContainers.length,
        running: allContainers.filter((c) => c.State === "running").length,
        nanobot: allContainers.filter((c) =>
          c.Names.some((n) => n.includes("nanobot"))
        ).length,
      }
    } catch (e) {
      info.errors.push(`获取容器列表失败: ${String(e)}`)
    }

    // List images
    try {
      const allImages = await docker.listImages()
      info.images = {
        total: allImages.length,
        nanobot: allImages.some((img) =>
          img.RepoTags?.some((tag) => tag.includes("nanobot"))
        ),
      }
    } catch (e) {
      info.errors.push(`获取镜像列表失败: ${String(e)}`)
    }

    // Get disk info
    try {
      const df = await docker.df()
      info.disk = {
        images: df.Images?.length || 0,
        containers: df.Containers?.length || 0,
        volumes: df.Volumes?.length || 0,
        buildCache: df.BuildCache?.length || 0,
      }
    } catch {
      // df might not be available
    }

    return Response.json(info)
  } catch (error) {
    return Response.json({
      dockerAvailable: false,
      errors: [`环境检查失败: ${String(error)}`],
    })
  }
}

function getSocketPath(): string {
  if (process.platform === "win32") {
    return "//./pipe/docker_engine"
  }
  return process.env.DOCKER_SOCKET || "/var/run/docker.sock"
}
