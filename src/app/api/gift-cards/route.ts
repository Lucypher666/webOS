import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const giftCards = await prisma.giftCard.findMany({
    where: session.user.role === "SUPER_ADMIN" ? {} : { workspaceId: session.user.workspaceId ?? "__none__" },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(giftCards)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const giftCard = await prisma.giftCard.create({
    data: {
      workspaceId: session.user.workspaceId,
      code: body.code.toUpperCase(),
      initialValue: parseFloat(body.amount),
      balance: parseFloat(body.amount),
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
      active: body.active ?? true,
    },
  })
  return NextResponse.json(giftCard, { status: 201 })
}
