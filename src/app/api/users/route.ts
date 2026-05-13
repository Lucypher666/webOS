import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().max(200).optional().nullable(),
  role: z.enum(["SUPER_ADMIN", "WORKSPACE_OWNER", "ADMIN", "EDITOR", "VIEWER"]).default("EDITOR"),
  workspaceId: z.string().optional().nullable(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, workspace: { select: { name: true } }, createdAt: true },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = createUserSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  if (parsed.data.workspaceId) {
    const ws = await prisma.workspace.findUnique({ where: { id: parsed.data.workspaceId }, select: { id: true } })
    if (!ws) return NextResponse.json({ error: "Workspace not found" }, { status: 400 })
  }

  const password = await bcrypt.hash(parsed.data.password, 12)
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      password,
      name: parsed.data.name ?? null,
      role: parsed.data.role,
      workspaceId: parsed.data.workspaceId ?? null,
    },
    select: { id: true, name: true, email: true, role: true, workspace: { select: { name: true } }, createdAt: true },
  })
  return NextResponse.json(user, { status: 201 })
}
