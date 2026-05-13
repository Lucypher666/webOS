import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!["SUPER_ADMIN", "WORKSPACE_OWNER"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const invitation = await prisma.invitation.findUnique({ where: { id } })
  if (!invitation) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (invitation.workspaceId !== session.user.workspaceId && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.invitation.delete({ where: { id } })
  return NextResponse.json({ message: "Invitation revoked" })
}
