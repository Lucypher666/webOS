import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspaceId = session.user.workspaceId
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 404 })

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { slug: true, name: true, apiKey: true },
  })

  if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(workspace)
}
