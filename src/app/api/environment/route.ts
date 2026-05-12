import { docker } from "@/lib/docker"

export async function GET() {
  try {
    const errors: string[] = []
    const info: Record<string, unknown> = {
      dockerAvailable: false,
      dockerVersion: null,
      os: process.platform,
      arch: process.arch,
      socketPath: getSocketPath(),
      containers: { total: 0, running: 0, stopped: 0, nanobot: 0, list: [] },
      images: { total: 0, nanobotFound: false, list: [] },
      disk: null,
      errors,
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
      errors.push(`Docker 连接失败: ${String(e)}`)
      return Response.json(info)
    }

    // List containers with details
    try {
      const allContainers = await docker.listContainers({ all: true })
      const containerList = allContainers.map((c) => ({
        id: c.Id.slice(0, 12),
        name: c.Names[0]?.replace(/^\//, "") || "",
        state: c.State,
        status: c.Status,
        image: c.Image,
        ports: c.Ports?.map((p) => `${p.PublicPort || ""}:${p.PrivatePort}`).filter((p) => !p.startsWith(":")) || [],
        createdAt: new Date(c.Created * 1000).toISOString(),
      }))

      info.containers = {
        total: allContainers.length,
        running: allContainers.filter((c) => c.State === "running").length,
        stopped: allContainers.filter((c) => c.State === "exited").length,
        nanobot: allContainers.filter((c) =>
          c.Names.some((n) => n.includes("nanobot"))
        ).length,
        list: containerList,
      }
    } catch (e) {
      errors.push(`获取容器列表失败: ${String(e)}`)
    }

    // List images with details
    try {
      const allImages = await docker.listImages()
      const imageList = allImages.map((img) => ({
        id: img.Id.slice(7, 19),
        tags: img.RepoTags || ["<none>:<none>"],
        size: formatBytes(img.Size),
        sizeBytes: img.Size,
        createdAt: new Date(img.Created * 1000).toISOString(),
      }))

      info.images = {
        total: allImages.length,
        nanobotFound: allImages.some((img) =>
          img.RepoTags?.some((tag) => tag.includes("nanobot"))
        ),
        list: imageList,
      }
    } catch (e) {
      errors.push(`获取镜像列表失败: ${String(e)}`)
    }

    // Get disk info
    try {
      const df = await docker.df()
      const imageSize = (df.Images || []).reduce((sum: number, img: any) => sum + (img.Size || 0), 0)
      const containerSize = (df.Containers || []).reduce((sum: number, c: any) => sum + (c.SizeRw || 0), 0)
      const volumeSize = (df.Volumes || []).reduce((sum: number, v: any) => sum + (v.UsageData?.Size || 0), 0)
      const buildCacheSize = (df.BuildCache || []).reduce((sum: number, b: any) => sum + (b.Size || 0), 0)

      info.disk = {
        images: { count: df.Images?.length || 0, size: formatBytes(imageSize), sizeBytes: imageSize },
        containers: { count: df.Containers?.length || 0, size: formatBytes(containerSize), sizeBytes: containerSize },
        volumes: { count: df.Volumes?.length || 0, size: formatBytes(volumeSize), sizeBytes: volumeSize },
        buildCache: { count: df.BuildCache?.length || 0, size: formatBytes(buildCacheSize), sizeBytes: buildCacheSize },
        totalSize: formatBytes(imageSize + containerSize + volumeSize + buildCacheSize),
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

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

function getSocketPath(): string {
  if (process.platform === "win32") {
    return "//./pipe/docker_engine"
  }
  return process.env.DOCKER_SOCKET || "/var/run/docker.sock"
}
