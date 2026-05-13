import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function toCSV(rows: Record<string, any>[]): string {
  if (!rows.length) return ""
  const headers = Object.keys(rows[0])
  const escape = (v: any) => {
    const s = v == null ? "" : String(v)
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [
    headers.join(","),
    ...rows.map(r => headers.map(h => escape(r[h])).join(",")),
  ].join("\n")
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const isSuperAdmin = session.user.role === "SUPER_ADMIN"
  const where = isSuperAdmin ? {} : { workspaceId: session.user.workspaceId ?? "__none__" }
  const type = req.nextUrl.searchParams.get("type") ?? "orders"

  let csv = ""
  let filename = ""

  if (type === "orders") {
    const orders = await prisma.order.findMany({
      where, orderBy: { createdAt: "desc" },
      include: { items: true },
    })
    const rows = orders.map(o => ({
      orderNumber: o.orderNumber,
      date: o.createdAt.toISOString().slice(0, 10),
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      customerPhone: o.customerPhone ?? "",
      status: o.status,
      paymentStatus: o.paymentStatus,
      subtotal: o.subtotal.toFixed(2),
      discount: o.discount.toFixed(2),
      total: o.total.toFixed(2),
      couponCode: o.couponCode ?? "",
      items: o.items.map(i => `${i.name} x${i.quantity}`).join("; "),
    }))
    csv = toCSV(rows)
    filename = `orders-${Date.now()}.csv`
  } else if (type === "products") {
    const products = await prisma.product.findMany({ where, orderBy: { createdAt: "desc" } })
    const rows = products.map(p => ({
      name: p.name,
      slug: p.slug,
      status: p.status,
      price: p.price.toFixed(2),
      comparePrice: p.comparePrice?.toFixed(2) ?? "",
      stock: p.stock,
      sku: p.sku ?? "",
      category: p.category ?? "",
      featured: p.featured ? "Yes" : "No",
      tags: (() => { try { return JSON.parse(p.tags).join(", ") } catch { return "" } })(),
      createdAt: p.createdAt.toISOString().slice(0, 10),
    }))
    csv = toCSV(rows)
    filename = `products-${Date.now()}.csv`
  } else if (type === "customers") {
    const orders = await prisma.order.findMany({ where, select: { customerName: true, customerEmail: true, customerPhone: true, total: true, createdAt: true } })
    const map = new Map<string, { name: string; email: string; phone: string; orders: number; spent: number; lastOrder: string }>()
    for (const o of orders) {
      const ex = map.get(o.customerEmail)
      if (ex) { ex.orders++; ex.spent += o.total; if (o.createdAt.toISOString() > ex.lastOrder) ex.lastOrder = o.createdAt.toISOString().slice(0, 10) }
      else map.set(o.customerEmail, { name: o.customerName, email: o.customerEmail, phone: o.customerPhone ?? "", orders: 1, spent: o.total, lastOrder: o.createdAt.toISOString().slice(0, 10) })
    }
    const rows = Array.from(map.values()).map(c => ({ ...c, spent: c.spent.toFixed(2) }))
    csv = toCSV(rows)
    filename = `customers-${Date.now()}.csv`
  } else {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
