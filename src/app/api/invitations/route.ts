import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { sendInvitationEmail } from "@/lib/email"

const createSchema = z.object({
  email: z.string().email(),
  role: z.enum(["EDITOR", "WORKSPACE_OWNER"]).default("EDITOR"),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspaceId = session.user.workspaceId
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 })

  const invitations = await prisma.invitation.findMany({
    where: { workspaceId },
    include: { invitedBy: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(invitations)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspaceId = session.user.workspaceId
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 })

  // Only owners can invite
  if (!["SUPER_ADMIN", "WORKSPACE_OWNER"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Only workspace owners can send invitations." }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { email, role } = parsed.data

    // Check if user is already in this workspace
    const existingUser = await prisma.user.findFirst({ where: { email, workspaceId } })
    if (existingUser) {
      return NextResponse.json({ error: "This user is already in your workspace." }, { status: 409 })
    }

    // Upsert invitation (resend if exists)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const invitation = await prisma.invitation.upsert({
      where: { workspaceId_email: { workspaceId, email } },
      update: { role, accepted: false, expiresAt, token: crypto.randomUUID() },
      create: {
        email,
        workspaceId,
        role,
        invitedById: session.user.id,
        expiresAt,
      },
      include: { workspace: { select: { name: true } } },
    })

    const acceptUrl = `${process.env.NEXTAUTH_URL}/accept-invite?token=${invitation.token}`
    try {
      await sendInvitationEmail({
        to: email,
        invitedBy: session.user.name ?? session.user.email ?? "Someone",
        workspaceName: invitation.workspace.name,
        acceptUrl,
      })
    } catch (emailErr) {
      console.warn("[INVITATIONS] Email send failed (non-fatal):", emailErr)
    }

    return NextResponse.json({ ...invitation, acceptUrl }, { status: 201 })
  } catch (err) {
    console.error("[INVITATIONS POST]", err)
    return NextResponse.json({ error: "Failed to send invitation" }, { status: 500 })
  }
}
