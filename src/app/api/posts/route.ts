import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/utils"

function parsePost(p: any) {
  return { ...p, tags: JSON.parse(p.tags ?? "[]") }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const isSuperAdmin = session.user.role === "SUPER_ADMIN"
  const posts = await prisma.post.findMany({
    where: isSuperAdmin ? {} : { workspaceId: session.user.workspaceId ?? "__none__" },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(posts.map(parsePost))
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!session.user.workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 })

  const body = await req.json()
  const post = await prisma.post.create({
    data: {
      workspaceId: session.user.workspaceId,
      title: body.title,
      slug: slugify(body.title),
      excerpt: body.excerpt || null,
      content: body.content,
      author: body.author || null,
      category: body.category || null,
      tags: JSON.stringify(body.tags ?? []),
      status: body.status ?? "DRAFT",
      publishedAt: body.status === "PUBLISHED" ? new Date() : null,
    },
  })
  return NextResponse.json(parsePost(post), { status: 201 })
}
