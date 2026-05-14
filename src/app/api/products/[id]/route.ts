import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { logAudit } from "@/lib/audit"
import { revalidateStorefront } from "@/lib/revalidate"

const patchSchema = z.object({
  name: z.string().min(1).max(500),
  description: z.string().optional().nullable(),
  price: z.number().min(0),
  comparePrice: z.number().min(0).optional().nullable(),
  stock: z.number().int().min(0).default(0),
  sku: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional().default("DRAFT"),
  featured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
})

function parseProduct(p: any) {
  return { ...p, tags: JSON.parse(p.tags ?? "[]"), images: JSON.parse(p.images ?? "[]") }
}

async function getProduct(id: string, session: any) {
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) return null
  if (session.user.role !== "SUPER_ADMIN" && product.workspaceId !== session.user.workspaceId) return null
  return product
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const product = await getProduct(id, session)
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(parseProduct(product))
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const existing = await getProduct(id, session)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }
  const { tags, images, ...rest } = parsed.data
  const product = await prisma.product.update({
    where: { id },
    data: { ...rest, tags: JSON.stringify(tags), images: JSON.stringify(images) },
  })
  revalidateStorefront({ tags: ["products", `product-${product.slug}`], paths: ["/products", `/products/${product.slug}`, "/"] })
  return NextResponse.json(parseProduct(product))
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const existing = await getProduct(id, session)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  await prisma.product.delete({ where: { id } })
  revalidateStorefront({ tags: ["products"], paths: ["/products", "/"] })
  await logAudit({
    workspaceId: existing.workspaceId,
    userId: session.user.id,
    action: "DELETE",
    entity: "product",
    entityId: id,
    metadata: { name: existing.name },
  })
  return NextResponse.json({ success: true })
}
