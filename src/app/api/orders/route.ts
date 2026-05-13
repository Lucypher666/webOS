import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { logAudit } from "@/lib/audit"
import { notify } from "@/lib/notify"

const orderItemSchema = z.object({
  productId: z.string().optional(),
  name: z.string().min(1),
  price: z.number().min(0),
  quantity: z.number().int().min(1),
  variantInfo: z.string().optional(),
})

const createOrderSchema = z.object({
  customerName: z.string().min(1).max(200),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  items: z.array(orderItemSchema).min(1),
  address: z.string().optional(),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
  paymentMethod: z.string().optional(),
})

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `ORD-${timestamp}-${random}`
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const isSuperAdmin = session.user.role === "SUPER_ADMIN"
  const workspaceId = session.user.workspaceId

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")))
  const status = searchParams.get("status")
  const search = searchParams.get("search")

  const where: any = isSuperAdmin ? {} : { workspaceId: workspaceId ?? "__none__" }
  if (status) where.status = status
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
      { customerEmail: { contains: search, mode: "insensitive" } },
    ]
  }

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        items: true,
        ...(isSuperAdmin ? { workspace: { select: { name: true } } } : {}),
      },
    }),
  ])

  return NextResponse.json({
    orders,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspaceId = session.user.workspaceId
  if (!workspaceId && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "No workspace assigned" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = createOrderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { customerName, customerEmail, customerPhone, items, address, couponCode, notes, paymentMethod } = parsed.data
    const wsId = workspaceId ?? (session.user.role === "SUPER_ADMIN" ? body.workspaceId : null)
    if (!wsId) return NextResponse.json({ error: "No workspace" }, { status: 403 })

    let discount = 0
    let appliedCoupon: string | undefined

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { workspaceId_code: { workspaceId: wsId, code: couponCode.toUpperCase() } },
      })

      if (coupon && coupon.active && (!coupon.expiryDate || coupon.expiryDate > new Date())) {
        const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
        if (!coupon.minSpend || subtotal >= coupon.minSpend) {
          if (!coupon.usageLimit || coupon.usageCount < coupon.usageLimit) {
            discount = coupon.discountType === "PERCENTAGE"
              ? (subtotal * coupon.amount) / 100
              : coupon.amount
            appliedCoupon = couponCode.toUpperCase()
            await prisma.coupon.update({
              where: { id: coupon.id },
              data: { usageCount: { increment: 1 } },
            })
          }
        }
      }
    }

    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const total = Math.max(0, subtotal - discount)

    const order = await prisma.order.create({
      data: {
        workspaceId: wsId,
        orderNumber: generateOrderNumber(),
        customerName,
        customerEmail,
        customerPhone,
        address,
        couponCode: appliedCoupon,
        discount,
        subtotal,
        total,
        notes,
        paymentMethod,
        items: {
          create: items.map(i => ({
            productId: i.productId ?? null,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            variantInfo: i.variantInfo ?? null,
          })),
        },
      },
      include: { items: true },
    })

    // Deduct stock for each product
    for (const item of items) {
      if (item.productId) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        }).catch(() => {}) // non-fatal if product deleted
      }
    }

    await logAudit({
      workspaceId: wsId,
      userId: session.user.id,
      action: "CREATE",
      entity: "order",
      entityId: order.id,
      metadata: { orderNumber: order.orderNumber, total },
    })

    await notify({
      workspaceId: wsId,
      title: "New Order Received",
      body: `${order.orderNumber} · $${total.toFixed(2)} from ${parsed.data.customerName}`,
      type: "success",
      link: `/orders/${order.id}`,
    })

    // Check for low stock after deducting
    for (const item of parsed.data.items) {
      if (item.productId) {
        const product = await prisma.product.findUnique({ where: { id: item.productId }, select: { name: true, stock: true } })
        if (product && product.stock <= 5) {
          await notify({
            workspaceId: wsId,
            title: product.stock === 0 ? "Product Out of Stock" : "Low Stock Alert",
            body: `${product.name} has ${product.stock} unit${product.stock !== 1 ? "s" : ""} remaining`,
            type: product.stock === 0 ? "error" : "warning",
            link: `/products`,
          })
        }
      }
    }

    return NextResponse.json(order, { status: 201 })
  } catch (err) {
    console.error("[ORDERS POST]", err)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
