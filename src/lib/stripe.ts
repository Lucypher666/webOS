import Stripe from "stripe"

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("[STRIPE] STRIPE_SECRET_KEY not set — billing features will be unavailable.")
}

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

export const PLANS = {
  FREE: {
    name: "Free",
    priceId: null,
    limits: { products: 50, ordersPerMonth: 100, teamMembers: 1 },
  },
  STARTER: {
    name: "Starter",
    priceId: process.env.STRIPE_STARTER_PRICE_ID ?? null,
    limits: { products: 500, ordersPerMonth: Infinity, teamMembers: 3 },
  },
  PRO: {
    name: "Pro",
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? null,
    limits: { products: Infinity, ordersPerMonth: Infinity, teamMembers: 10 },
  },
} as const

export type PlanKey = keyof typeof PLANS
