import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let workspaceId: string | null = session.user.workspaceId ?? null

  // If super admin has no workspaceId, pick the first one available as a fallback
  if (!workspaceId && session.user.role === "SUPER_ADMIN") {
    const firstWorkspace = await prisma.workspace.findFirst()
    workspaceId = firstWorkspace?.id ?? null
  }

  if (!workspaceId) return NextResponse.json({ error: "No workspace context found" }, { status: 400 })

  const { products } = await req.json()

  const created = await prisma.$transaction(
    products.map((p: any) => {
      const baseSlug = p.name.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-")
      const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`
      
      return prisma.product.create({
        data: {
          workspaceId: workspaceId!,
          name: p.name,
          slug: uniqueSlug,
          sku: p.sku || null,
          price: p.price,
          stock: p.stock || 0,
          status: p.status || "ACTIVE",
          images: "[]",
          tags: "[]",
        }
      })
    })
  )

  return NextResponse.json(created)
}
