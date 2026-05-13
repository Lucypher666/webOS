import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"

export async function POST(req: NextRequest) {
  if (!stripe) return NextResponse.json({ error: "Billing not configured" }, { status: 503 })

  const body = await req.text()
  const sig = req.headers.get("stripe-signature")
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing stripe signature" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error("[STRIPE WEBHOOK] Signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const workspaceId = session.metadata?.workspaceId
        const plan = session.metadata?.plan
        if (workspaceId && plan && session.subscription) {
          await prisma.subscription.update({
            where: { workspaceId },
            data: {
              stripeSubscriptionId: session.subscription as string,
              plan,
              status: "active",
            },
          })
          await prisma.workspace.update({ where: { id: workspaceId }, data: { plan } })
        }
        break
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription
        const workspaceId = sub.metadata?.workspaceId
        if (workspaceId) {
          await prisma.subscription.update({
            where: { workspaceId },
            data: {
              status: sub.status,
              stripePriceId: sub.items.data[0]?.price.id ?? null,
              currentPeriodEnd: (sub as any).current_period_end ? new Date((sub as any).current_period_end * 1000) : null,
              cancelAtPeriodEnd: (sub as any).cancel_at_period_end ?? false,
            },
          })
        }
        break
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription
        const workspaceId = sub.metadata?.workspaceId
        if (workspaceId) {
          await prisma.subscription.update({
            where: { workspaceId },
            data: { status: "canceled", plan: "FREE" },
          })
          await prisma.workspace.update({ where: { id: workspaceId }, data: { plan: "FREE" } })
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        if (customerId) {
          await prisma.subscription.updateMany({
            where: { stripeCustomerId: customerId },
            data: { status: "past_due" },
          })
        }
        break
      }
    }
  } catch (err) {
    console.error("[STRIPE WEBHOOK] Handler error:", err)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
