import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidateStorefront } from "@/lib/revalidate"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const theme = await prisma.theme.findUnique({ where: { workspaceId: session.user.workspaceId ?? "__none__" } })
  return NextResponse.json(theme)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!session.user.workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 })

  const body = await req.json()
  const theme = await prisma.theme.upsert({
    where: { workspaceId: session.user.workspaceId },
    update: body,
    create: { workspaceId: session.user.workspaceId, ...body },
  })
  revalidateStorefront({ tags: ["theme"], paths: ["/"] })
  return NextResponse.json(theme)
}
