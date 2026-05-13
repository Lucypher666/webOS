import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { stripe, PLANS, PlanKey } from "@/lib/stripe"
import { z } from "zod"

const schema = z.object({
  plan: z.enum(["STARTER", "PRO"]),
})

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Billing is not configured." }, { status: 503 })
  }

  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspaceId = session.user.workspaceId
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid plan" }, { status: 400 })

  const planKey = parsed.data.plan as PlanKey
  const plan = PLANS[planKey]
  if (!plan.priceId) return NextResponse.json({ error: "Plan not configured" }, { status: 400 })

  let subscription = await prisma.subscription.findUnique({ where: { workspaceId } })

  let customerId = subscription?.stripeCustomerId

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email!,
      name: session.user.name ?? undefined,
      metadata: { workspaceId },
    })
    customerId = customer.id

    if (!subscription) {
      subscription = await prisma.subscription.create({
        data: { workspaceId, stripeCustomerId: customerId },
      })
    } else {
      await prisma.subscription.update({
        where: { workspaceId },
        data: { stripeCustomerId: customerId },
      })
    }
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: plan.priceId, quantity: 1 }],
    success_url: `${process.env.NEXTAUTH_URL}/settings?billing=success`,
    cancel_url: `${process.env.NEXTAUTH_URL}/settings?billing=cancelled`,
    metadata: { workspaceId, plan: planKey },
    subscription_data: { metadata: { workspaceId, plan: planKey } },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
