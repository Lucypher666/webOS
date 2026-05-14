import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspaceId = session.user.workspaceId
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 404 })

  // Only owners and admins can regenerate the key
  const allowed = ["WORKSPACE_OWNER", "ADMIN", "SUPER_ADMIN"]
  if (!allowed.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const newKey = `wos_${crypto.randomBytes(24).toString("hex")}`

  const workspace = await prisma.workspace.update({
    where: { id: workspaceId },
    data: { apiKey: newKey },
    select: { apiKey: true },
  })

  return NextResponse.json({ apiKey: workspace.apiKey })
}
