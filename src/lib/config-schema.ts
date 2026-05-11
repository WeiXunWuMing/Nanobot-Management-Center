import { z } from "zod"

export const providerConfigSchema = z.object({
  apiKey: z.string().optional(),
  apiBase: z.string().optional(),
})

export const providersConfigSchema = z.record(z.string(), providerConfigSchema)

export const agentDefaultsSchema = z.object({
  model: z.string().optional(),
  provider: z.string().optional(),
  workspace: z.string().optional(),
  maxTokens: z.number().optional(),
  temperature: z.number().optional(),
  timezone: z.string().optional(),
})

export const agentsConfigSchema = z.object({
  defaults: agentDefaultsSchema.optional(),
})

export const channelConfigSchema = z.record(z.string(), z.unknown())

export const channelsConfigSchema = z.record(z.string(), channelConfigSchema)

export const mcpServerSchema = z.object({
  type: z.enum(["stdio", "sse", "streamableHttp"]).optional(),
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string(), z.string()).optional(),
  url: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
})

export const toolsConfigSchema = z.object({
  mcpServers: z.record(z.string(), mcpServerSchema).optional(),
  web: z
    .object({
      enable: z.boolean().optional(),
      search: z
        .object({
          provider: z.string().optional(),
          apiKey: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  exec: z
    .object({
      enable: z.boolean().optional(),
      timeout: z.number().optional(),
    })
    .optional(),
})

export const configSchema = z.object({
  agents: agentsConfigSchema.optional(),
  channels: channelsConfigSchema.optional(),
  providers: providersConfigSchema.optional(),
  tools: toolsConfigSchema.optional(),
  gateway: z
    .object({
      host: z.string().optional(),
      port: z.number().optional(),
    })
    .optional(),
  api: z
    .object({
      host: z.string().optional(),
      port: z.number().optional(),
    })
    .optional(),
})

export type NanobotConfig = z.infer<typeof configSchema>

export const PROVIDERS = [
  { name: "anthropic", label: "Anthropic", modelPlaceholder: "anthropic/claude-sonnet-4-20250514" },
  { name: "openai", label: "OpenAI", modelPlaceholder: "gpt-4o" },
  { name: "deepseek", label: "DeepSeek", modelPlaceholder: "deepseek-v4-flash" },
  { name: "gemini", label: "Google Gemini", modelPlaceholder: "gemini-2.0-flash" },
  { name: "openrouter", label: "OpenRouter", modelPlaceholder: "anthropic/claude-sonnet-4" },
  { name: "ollama", label: "Ollama (本地)", modelPlaceholder: "llama3.2" },
  { name: "groq", label: "Groq", modelPlaceholder: "llama-3.3-70b-versatile" },
  { name: "zhipu", label: "智谱 AI", modelPlaceholder: "glm-4-flash" },
  { name: "dashscope", label: "通义千问", modelPlaceholder: "qwen-turbo" },
  { name: "moonshot", label: "月之暗面", modelPlaceholder: "moonshot-v1-8k" },
  { name: "minimax", label: "MiniMax", modelPlaceholder: "MiniMax-Text-01" },
  { name: "siliconflow", label: "硅基流动", modelPlaceholder: "deepseek-ai/DeepSeek-V3" },
  { name: "volcengine", label: "火山引擎", modelPlaceholder: "doubao-1.5-pro-32k" },
] as const

export const CHANNELS = [
  { name: "telegram", label: "Telegram", fields: ["token"] },
  { name: "discord", label: "Discord", fields: ["token"] },
  { name: "slack", label: "Slack", fields: ["token", "appToken", "signingSecret"] },
  { name: "wechat", label: "微信公众号", fields: ["appId", "appSecret", "token"] },
  { name: "feishu", label: "飞书", fields: ["appId", "appSecret"] },
  { name: "dingtalk", label: "钉钉", fields: ["appKey", "appSecret"] },
] as const
