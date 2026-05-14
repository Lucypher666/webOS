import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/utils"
import { z } from "zod"
import { logAudit } from "@/lib/audit"
import { revalidateStorefront } from "@/lib/revalidate"

const createSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  price: z.number().min(0),
  comparePrice: z.number().min(0).optional(),
  stock: z.number().int().min(0).default(0),
  sku: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("DRAFT"),
  featured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
})

function parseProduct(p: any) {
  return { ...p, tags: JSON.parse(p.tags ?? "[]"), images: JSON.parse(p.images ?? "[]") }
}

async function uniqueSlug(base: string, workspaceId: string): Promise<string> {
  const slug = slugify(base)
  let suffix = 0
  while (true) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`
    const exists = await prisma.product.findUnique({ where: { workspaceId_slug: { workspaceId, slug: candidate } } })
    if (!exists) return candidate
    suffix++
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const isSuperAdmin = session.user.role === "SUPER_ADMIN"
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")))
  const search = searchParams.get("search")
  const status = searchParams.get("status")
  const category = searchParams.get("category")
  const featured = searchParams.get("featured")

  const where: any = isSuperAdmin ? {} : { workspaceId: session.user.workspaceId ?? "__none__" }
  if (status) where.status = status
  if (category) where.category = category
  if (featured === "true") where.featured = true
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
      { category: { contains: search, mode: "insensitive" } },
    ]
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: { workspace: { select: { name: true } }, variants: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])

  return NextResponse.json({
    products: products.map(parseProduct),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!session.user.workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 })

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { name, tags, images, ...rest } = parsed.data
    const slug = await uniqueSlug(name, session.user.workspaceId)

    const product = await prisma.product.create({
      data: {
        workspaceId: session.user.workspaceId,
        name,
        slug,
        tags: JSON.stringify(tags),
        images: JSON.stringify(images),
        ...rest,
        description: rest.description ?? null,
        sku: rest.sku ?? null,
        category: rest.category ?? null,
        comparePrice: rest.comparePrice ?? null,
      },
    })

    await logAudit({
      workspaceId: session.user.workspaceId,
      userId: session.user.id,
      action: "CREATE",
      entity: "product",
      entityId: product.id,
      metadata: { name },
    })

    revalidateStorefront({ tags: ["products"], paths: ["/products", "/"] })
    return NextResponse.json(parseProduct(product), { status: 201 })
  } catch (err) {
    console.error("[PRODUCTS POST]", err)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}
