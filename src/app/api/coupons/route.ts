import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const coupons = await prisma.coupon.findMany({
    where: session.user.role === "SUPER_ADMIN" ? {} : { workspaceId: session.user.workspaceId ?? "__none__" },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(coupons)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const coupon = await prisma.coupon.create({
    data: {
      workspaceId: session.user.workspaceId,
      code: body.code.toUpperCase(),
      discountType: body.discountType,
      amount: parseFloat(body.amount),
      minSpend: body.minSpend ? parseFloat(body.minSpend) : null,
      usageLimit: body.usageLimit ? parseInt(body.usageLimit) : null,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
      active: body.active ?? true,
    },
  })
  return NextResponse.json(coupon, { status: 201 })
}
