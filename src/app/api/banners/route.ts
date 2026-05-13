import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const isSuperAdmin = session.user.role === "SUPER_ADMIN"
  const banners = await prisma.banner.findMany({
    where: isSuperAdmin ? {} : { workspaceId: session.user.workspaceId ?? "__none__" },
    orderBy: { order: "asc" },
  })
  return NextResponse.json(banners)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!session.user.workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 })

  const body = await req.json()
  const count = await prisma.banner.count({ where: { workspaceId: session.user.workspaceId } })
  const banner = await prisma.banner.create({
    data: {
      workspaceId: session.user.workspaceId,
      title: body.title,
      subtitle: body.subtitle || null,
      image: body.image || null,
      link: body.link || null,
      buttonText: body.buttonText || null,
      order: count,
    },
  })
  return NextResponse.json(banner, { status: 201 })
}
