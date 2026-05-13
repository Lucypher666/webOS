import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/utils"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const workspaces = await prisma.workspace.findMany({
    include: { _count: { select: { users: true, products: true, orders: true } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(workspaces)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const slug = slugify(body.name)

  const workspace = await prisma.workspace.create({
    data: {
      name: body.name,
      slug,
      description: body.description || null,
      domain: body.domain || null,
    },
  })

  await prisma.settings.create({ data: { workspaceId: workspace.id, siteName: workspace.name } })
  await prisma.theme.create({ data: { workspaceId: workspace.id } })
  await prisma.seoConfig.create({ data: { workspaceId: workspace.id } })

  return NextResponse.json(workspace, { status: 201 })
}
