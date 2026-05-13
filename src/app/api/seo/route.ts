import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const seo = await prisma.seoConfig.findUnique({ where: { workspaceId: session.user.workspaceId ?? "__none__" } })
  return NextResponse.json(seo)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!session.user.workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 })

  const body = await req.json()
  const seo = await prisma.seoConfig.upsert({
    where: { workspaceId: session.user.workspaceId },
    update: body,
    create: { workspaceId: session.user.workspaceId, ...body },
  })
  return NextResponse.json(seo)
}
