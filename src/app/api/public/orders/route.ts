/**
 * POST /api/public/orders
 * Public endpoint — storefront uses this to place orders.
 * Requires ?workspace=slug query param.
 */
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { randomBytes } from "crypto"
function nanoid(n: number) { return randomBytes(n).toString("base64url").slice(0, n).toUpperCase() }

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

const itemSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional().nullable(),
  name: z.string(),
  price: z.number().min(0),
  quantity: z.number().int().min(1),
})

const orderSchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  shippingAddress: z.string().min(1),
  city: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  notes: z.string().optional(),
  couponCode: z.string().optional(),
  giftCardCode: z.string().optional(),
  items: z.array(itemSchema).min(1),
})

export async function POST(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("workspace")
  if (!slug) return NextResponse.json({ error: "workspace param required" }, { status: 400, headers: CORS })

  const workspace = await prisma.workspace.findUnique({ where: { slug } })
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404, headers: CORS })

  const body = await req.json().catch(() => null)
  const parsed = orderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400, headers: CORS })
  }

  const data = parsed.data
  let discount = 0
  let couponId: string | null = null
  let giftCardId: string | null = null

  const subtotal = data.items.reduce((s, i) => s + i.price * i.quantity, 0)

  // Validate coupon
  if (data.couponCode) {
    const coupon = await prisma.coupon.findFirst({
      where: { workspaceId: workspace.id, code: data.couponCode.toUpperCase(), active: true },
    })
    if (!coupon) return NextResponse.json({ error: "Invalid or expired coupon code" }, { status: 400, headers: CORS })
    if (coupon.expiryDate && coupon.expiryDate < new Date()) {
      return NextResponse.json({ error: "This coupon has expired" }, { status: 400, headers: CORS })
    }
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json({ error: "This coupon has reached its usage limit" }, { status: 400, headers: CORS })
    }
    if (coupon.minSpend && subtotal < coupon.minSpend) {
      return NextResponse.json({ error: `Minimum spend of $${coupon.minSpend} required` }, { status: 400, headers: CORS })
    }
    discount = coupon.discountType === "PERCENTAGE"
      ? subtotal * (coupon.amount / 100)
      : coupon.amount
    couponId = coupon.id
  }

  // Validate gift card
  if (data.giftCardCode) {
    const gc = await prisma.giftCard.findFirst({
      where: { workspaceId: workspace.id, code: data.giftCardCode.toUpperCase(), active: true },
    })
    if (!gc) return NextResponse.json({ error: "Invalid or expired gift card" }, { status: 400, headers: CORS })
    if (gc.expiryDate && gc.expiryDate < new Date()) {
      return NextResponse.json({ error: "This gift card has expired" }, { status: 400, headers: CORS })
    }
    if (gc.balance <= 0) {
      return NextResponse.json({ error: "This gift card has no remaining balance" }, { status: 400, headers: CORS })
    }
    const gcDiscount = Math.min(gc.balance, subtotal - discount)
    discount += gcDiscount
    giftCardId = gc.id
  }

  const total = Math.max(0, subtotal - discount)
  const orderNumber = `ORD-${nanoid(8).toUpperCase()}`

  // Create order + items in a transaction
  const order = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        workspaceId: workspace.id,
        orderNumber,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone ?? null,
        shippingAddress: data.shippingAddress,
        subtotal,
        discount,
        total,
        status: "PENDING",
        paymentStatus: "UNPAID",
        notes: data.notes ?? null,
        items: {
          create: data.items.map(i => ({
            productId: i.productId,
            variantId: i.variantId ?? null,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            total: i.price * i.quantity,
          })),
        },
      },
      include: { items: true },
    })

    // Increment coupon usage
    if (couponId) await tx.coupon.update({ where: { id: couponId }, data: { usageCount: { increment: 1 } } })

    // Deduct gift card balance
    if (giftCardId) {
      const gc = await tx.giftCard.findUnique({ where: { id: giftCardId } })
      if (gc) {
        const used = Math.min(gc.balance, subtotal)
        await tx.giftCard.update({ where: { id: giftCardId }, data: { balance: { decrement: used } } })
      }
    }

    return order
  })

  return NextResponse.json({
    success: true,
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      status: order.status,
    }
  }, { status: 201, headers: CORS })
}
