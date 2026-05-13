import { prisma } from "@/lib/prisma"

interface NotifyOptions {
  workspaceId: string
  title: string
  body: string
  type?: "info" | "success" | "warning" | "error"
  link?: string
}

export async function notify({ workspaceId, title, body, type = "info", link }: NotifyOptions) {
  try {
    await (prisma as any).notification.create({
      data: { workspaceId, title, body, type, link },
    })
  } catch (err) {
    console.warn("[notify] failed (non-fatal):", err)
  }
}
