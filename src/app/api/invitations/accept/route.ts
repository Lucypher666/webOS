import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

// GET - Validate token and return invite info
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get("token")
  if (!token) return NextResponse.json({ error: "Invalid invitation link." }, { status: 400 })

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      workspace: { select: { name: true } },
      invitedBy: { select: { name: true, email: true } },
    },
  })

  if (!invitation || invitation.accepted) {
    return NextResponse.json({ error: "This invitation link is invalid or has already been used." }, { status: 400 })
  }
  if (invitation.expiresAt < new Date()) {
    return NextResponse.json({ error: "This invitation has expired. Ask your workspace owner to resend it." }, { status: 400 })
  }

  const userExists = !!(await prisma.user.findUnique({ where: { email: invitation.email } }))

  return NextResponse.json({
    email: invitation.email,
    workspaceName: invitation.workspace.name,
    invitedBy: invitation.invitedBy.name ?? invitation.invitedBy.email,
    userExists,
  })
}

const acceptSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  password: z.string().min(8).max(100).optional(),
})

// POST - Accept invitation (create account or add to workspace)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = acceptSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { token, name, password } = parsed.data

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { workspace: { select: { id: true, name: true } } },
    })

    if (!invitation || invitation.accepted || invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invalid or expired invitation." }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { email: invitation.email } })

    if (existingUser) {
      // User exists — just add them to the workspace
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { workspaceId: invitation.workspaceId, role: invitation.role },
      })
    } else {
      // New user — create account
      if (!name || !password) {
        return NextResponse.json({ error: "Name and password are required for new accounts." }, { status: 400 })
      }
      const hashedPassword = await bcrypt.hash(password, 12)
      await prisma.user.create({
        data: {
          email: invitation.email,
          password: hashedPassword,
          name,
          role: invitation.role,
          workspaceId: invitation.workspaceId,
        },
      })
    }

    await prisma.invitation.update({ where: { id: invitation.id }, data: { accepted: true } })

    return NextResponse.json({ message: "Invitation accepted successfully." })
  } catch (err) {
    console.error("[ACCEPT_INVITE]", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
