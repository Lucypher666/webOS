import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { logAudit } from "@/lib/audit"

const updateSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]).optional(),
  shippingStatus: z.enum(["UNFULFILLED", "PARTIALLY_FULFILLED", "FULFILLED"]).optional(),
  trackingNumber: z.string().optional(),
  trackingUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
  paymentStatus: z.enum(["UNPAID", "PAID", "REFUNDED", "PARTIALLY_REFUNDED"]).optional(),
})

async function getOrderAndCheck(id: string, session: any) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  })
  if (!order) return null
  if (session.user.role !== "SUPER_ADMIN" && order.workspaceId !== session.user.workspaceId) return null
  return order
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const order = await getOrderAndCheck(params.id, session)
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(order)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const order = await getOrderAndCheck(params.id, session)
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })

  try {
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const updated = await prisma.order.update({
      where: { id: params.id },
      data: parsed.data,
      include: { items: true },
    })

    await logAudit({
      workspaceId: order.workspaceId,
      userId: session.user.id,
      action: "UPDATE",
      entity: "order",
      entityId: order.id,
      metadata: parsed.data,
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error("[ORDER PATCH]", err)
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const order = await getOrderAndCheck(params.id, session)
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (!["CANCELLED", "REFUNDED"].includes(order.status)) {
    return NextResponse.json({ error: "Only cancelled or refunded orders can be deleted." }, { status: 400 })
  }

  await prisma.order.delete({ where: { id: params.id } })

  await logAudit({
    workspaceId: order.workspaceId,
    userId: session.user.id,
    action: "DELETE",
    entity: "order",
    entityId: order.id,
    metadata: { orderNumber: order.orderNumber },
  })

  return NextResponse.json({ message: "Order deleted" })
}
