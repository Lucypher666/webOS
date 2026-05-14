import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidateStorefront } from "@/lib/revalidate"

function parseSettings(s: any) {
  return { ...s, socialLinks: s.socialLinks ? JSON.parse(s.socialLinks) : null }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const workspaceId = session.user.workspaceId ?? "__none__"
  
  const [settings, workspace] = await Promise.all([
    prisma.settings.findUnique({ where: { workspaceId } }),
    prisma.workspace.findUnique({ where: { id: workspaceId }, select: { apiKey: true } })
  ])

  return NextResponse.json({
    ...(settings ? parseSettings(settings) : {}),
    apiKey: workspace?.apiKey
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!session.user.workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 })
  const allowedRoles = ["WORKSPACE_OWNER", "ADMIN", "SUPER_ADMIN"]
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const data = { ...body, socialLinks: body.socialLinks ? JSON.stringify(body.socialLinks) : null }
  const settings = await prisma.settings.upsert({
    where: { workspaceId: session.user.workspaceId },
    update: data,
    create: { workspaceId: session.user.workspaceId, siteName: body.siteName, ...data },
  })
  revalidateStorefront({ tags: ["settings"], paths: ["/"] })
  return NextResponse.json(parseSettings(settings))
}
