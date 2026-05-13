import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const workspace = await prisma.workspace.findUnique({
    where: { slug, active: true },
    include: {
      settings: true,
      theme: true,
      seo: true,
      banners: { where: { active: true }, orderBy: { order: "asc" } },
      products: { where: { status: "ACTIVE" }, orderBy: { createdAt: "desc" } },
      posts: { where: { status: "PUBLISHED" }, orderBy: { publishedAt: "desc" } },
      pages: { where: { status: "PUBLISHED" } },
    },
  })

  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 })

  const data = {
    ...workspace,
    settings: workspace.settings
      ? { ...workspace.settings, socialLinks: workspace.settings.socialLinks ? JSON.parse(workspace.settings.socialLinks) : null }
      : null,
    products: workspace.products.map(p => ({ ...p, tags: JSON.parse(p.tags), images: JSON.parse(p.images) })),
    posts: workspace.posts.map(p => ({ ...p, tags: JSON.parse(p.tags) })),
    pages: workspace.pages.map(p => ({ ...p, content: JSON.parse(p.content) })),
  }

  return NextResponse.json(data, {
    headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "s-maxage=60, stale-while-revalidate" },
  })
}
