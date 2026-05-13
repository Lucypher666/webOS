import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const workspaceId = session.user.workspaceId
  if (!workspaceId) return NextResponse.json([])

  const notifications = await (prisma as any).notification.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: 30,
  })
  return NextResponse.json(notifications)
}

// Mark all as read
export async function PATCH() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const workspaceId = session.user.workspaceId
  if (!workspaceId) return NextResponse.json({ ok: true })

  await (prisma as any).notification.updateMany({
    where: { workspaceId, read: false },
    data: { read: true },
  })
  return NextResponse.json({ ok: true })
}

// Clear all
export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const workspaceId = session.user.workspaceId
  if (!workspaceId) return NextResponse.json({ ok: true })

  await (prisma as any).notification.deleteMany({ where: { workspaceId } })
  return NextResponse.json({ ok: true })
}
