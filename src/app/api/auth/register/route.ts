import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { rateLimit } from "@/lib/rate-limit"

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  workspaceName: z.string().min(1).max(100),
  plan: z.enum(["free", "starter", "pro"]).default("free"),
})

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = slugify(base)
  let suffix = 0
  while (true) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`
    const exists = await prisma.workspace.findUnique({ where: { slug: candidate } })
    if (!exists) return candidate
    suffix++
  }
}

export async function POST(req: NextRequest) {
  // 5 registrations per IP per hour
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown"
  const rl = rateLimit({ key: `register:${ip}`, limit: 5, windowMs: 60 * 60 * 1000 })
  if (!rl.success) {
    return NextResponse.json({ error: "Too many registrations. Please try again later." }, { status: 429 })
  }

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { name, email, password, workspaceName, plan } = parsed.data

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const slug = await uniqueSlug(workspaceName)

    const workspace = await prisma.workspace.create({
      data: {
        name: workspaceName,
        slug,
        plan: plan.toUpperCase(),
        settings: {
          create: {
            siteName: workspaceName,
            currency: "USD",
            timezone: "UTC",
          },
        },
        seo: { create: {} },
        theme: { create: {} },
        subscription: {
          create: {
            plan: plan.toUpperCase(),
            status: "active",
          },
        },
      },
    })

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: "WORKSPACE_OWNER",
        workspaceId: workspace.id,
      },
    })

    await prisma.auditLog.create({
      data: {
        workspaceId: workspace.id,
        action: "REGISTER",
        entity: "workspace",
        entityId: workspace.id,
        metadata: JSON.stringify({ workspaceName, plan }),
      },
    })

    return NextResponse.json({ message: "Workspace created successfully." }, { status: 201 })
  } catch (err) {
    console.error("[REGISTER]", err)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
