import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/utils"
import { revalidateStorefront } from "@/lib/revalidate"

function parsePage(p: any) {
  return { ...p, content: typeof p.content === "string" ? JSON.parse(p.content) : p.content }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const isSuperAdmin = session.user.role === "SUPER_ADMIN"
  const pages = await prisma.page.findMany({
    where: isSuperAdmin ? {} : { workspaceId: session.user.workspaceId ?? "__none__" },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(pages.map(parsePage))
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!session.user.workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 })

  const body = await req.json()
  const page = await prisma.page.create({
    data: {
      workspaceId: session.user.workspaceId,
      title: body.title,
      slug: slugify(body.title),
      content: JSON.stringify(body.content ?? {}),
      status: body.status ?? "DRAFT",
      seoTitle: body.seoTitle || null,
      seoDesc: body.seoDesc || null,
    },
  })
  revalidateStorefront({ tags: ["pages"], paths: ["/"] })
  return NextResponse.json(parsePage(page), { status: 201 })
}
