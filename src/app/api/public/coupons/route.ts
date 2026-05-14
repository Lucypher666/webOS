/**
 * POST /api/public/coupons?workspace=slug
 * Validate a coupon code and return the discount amount.
 */
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function POST(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("workspace")
  if (!slug) return NextResponse.json({ error: "workspace param required" }, { status: 400, headers: CORS })

  const workspace = await prisma.workspace.findUnique({ where: { slug } })
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404, headers: CORS })

  const { code, subtotal = 0 } = await req.json().catch(() => ({}))
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400, headers: CORS })

  const coupon = await prisma.coupon.findFirst({
    where: { workspaceId: workspace.id, code: String(code).toUpperCase(), active: true },
  })

  if (!coupon) return NextResponse.json({ valid: false, error: "Invalid coupon code" }, { headers: CORS })
  if (coupon.expiryDate && coupon.expiryDate < new Date()) return NextResponse.json({ valid: false, error: "Coupon has expired" }, { headers: CORS })
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return NextResponse.json({ valid: false, error: "Coupon usage limit reached" }, { headers: CORS })
  if (coupon.minSpend && subtotal < coupon.minSpend) return NextResponse.json({ valid: false, error: `Minimum spend $${coupon.minSpend} required` }, { headers: CORS })

  const discount = coupon.discountType === "PERCENTAGE"
    ? subtotal * (coupon.amount / 100)
    : coupon.amount

  return NextResponse.json({
    valid: true,
    discount,
    discountType: coupon.discountType,
    amount: coupon.amount,
    code: coupon.code,
  }, { headers: CORS })
}
