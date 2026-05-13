import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const variantSchema = z.object({
  name: z.string().min(1).max(100),
  options: z.array(z.object({ name: z.string(), value: z.string() })).default([]),
  price: z.number().min(0).optional(),
  stock: z.number().int().min(0).default(0),
  sku: z.string().max(100).optional(),
})

async function getProductAndCheck(productId: string, session: any) {
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) return null
  if (session.user.role !== "SUPER_ADMIN" && product.workspaceId !== session.user.workspaceId) return null
  return product
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const product = await getProductAndCheck(id, session)
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const variants = await prisma.productVariant.findMany({
    where: { productId: id },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(variants.map(v => ({ ...v, options: JSON.parse(v.options) })))
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const product = await getProductAndCheck(id, session)
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const parsed = variantSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const { options, ...rest } = parsed.data
  const variant = await prisma.productVariant.create({
    data: {
      productId: id,
      options: JSON.stringify(options),
      price: rest.price ?? null,
      sku: rest.sku ?? null,
      ...rest,
    },
  })

  return NextResponse.json({ ...variant, options }, { status: 201 })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const product = await getProductAndCheck(id, session)
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const parsed = z.array(variantSchema).safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  await prisma.productVariant.deleteMany({ where: { productId: id } })

  const created = await prisma.productVariant.createMany({
    data: parsed.data.map(v => ({
      productId: id,
      name: v.name,
      options: JSON.stringify(v.options),
      price: v.price ?? null,
      stock: v.stock,
      sku: v.sku ?? null,
    })),
  })

  return NextResponse.json({ count: created.count })
}
