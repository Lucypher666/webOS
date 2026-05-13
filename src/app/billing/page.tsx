import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/page-header"
import { CreditCard, Check, Zap } from "lucide-react"
import Link from "next/link"

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Perfect to get started",
    features: ["1 workspace", "Up to 50 products", "100 orders/month", "Community support"],
    current: true,
    highlight: false,
  },
  {
    name: "Starter",
    price: "$19",
    period: "/month",
    description: "For growing businesses",
    features: ["1 workspace", "Up to 500 products", "Unlimited orders", "Email support", "Custom domain", "Coupons & Gift cards"],
    current: false,
    highlight: true,
    comingSoon: true,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    description: "For serious operations",
    features: ["3 workspaces", "Unlimited products", "Unlimited orders", "Priority support", "Team members", "Advanced analytics"],
    current: false,
    highlight: false,
    comingSoon: true,
  },
]

export default async function BillingPage() {
  const session = await getServerSession(authOptions)
  const workspace = session?.user?.workspaceId
    ? await prisma.workspace.findUnique({
        where: { id: session.user.workspaceId },
        select: { name: true, plan: true, createdAt: true },
      })
    : null

  const currentPlan = workspace?.plan ?? "FREE"

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & Plans"
        description="Manage your subscription and usage"
        icon={CreditCard}
      />

      {/* Current plan banner */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-1">Current Plan</p>
          <p className="text-2xl font-bold text-zinc-900">{currentPlan.charAt(0) + currentPlan.slice(1).toLowerCase()}</p>
          <p className="text-sm text-zinc-500 mt-1">
            Workspace: <span className="font-medium text-zinc-700">{workspace?.name}</span>
          </p>
        </div>
        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
          <Zap className="w-6 h-6 text-blue-600" />
        </div>
      </div>

      {/* Plans */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-900 mb-4">Available Plans</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map(plan => (
            <div
              key={plan.name}
              className={`rounded-xl border p-6 flex flex-col ${
                plan.highlight
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-white border-zinc-200"
              }`}
            >
              <div className="mb-5">
                <div className="flex items-center justify-between mb-1">
                  <p className={`text-sm font-semibold ${plan.highlight ? "text-blue-100" : "text-zinc-500"}`}>
                    {plan.name}
                  </p>
                  {currentPlan.toUpperCase() === plan.name.toUpperCase() && (
                    <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                      Current
                    </span>
                  )}
                </div>
                <div className="flex items-end gap-1">
                  <span className={`text-3xl font-bold ${plan.highlight ? "text-white" : "text-zinc-900"}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm pb-1 ${plan.highlight ? "text-blue-200" : "text-zinc-400"}`}>
                    {plan.period}
                  </span>
                </div>
                <p className={`text-xs mt-1 ${plan.highlight ? "text-blue-100" : "text-zinc-400"}`}>
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className={`w-4 h-4 shrink-0 ${plan.highlight ? "text-blue-200" : "text-emerald-500"}`} />
                    <span className={plan.highlight ? "text-blue-50" : "text-zinc-600"}>{f}</span>
                  </li>
                ))}
              </ul>

              {plan.comingSoon ? (
                <div className={`w-full text-center text-sm font-medium py-2 rounded-lg cursor-not-allowed opacity-60 ${
                  plan.highlight ? "bg-white text-blue-600" : "bg-zinc-100 text-zinc-400"
                }`}>
                  Coming Soon
                </div>
              ) : currentPlan.toUpperCase() === plan.name.toUpperCase() ? (
                <div className={`w-full text-center text-sm font-medium py-2 rounded-lg ${
                  plan.highlight ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-500"
                }`}>
                  Active Plan
                </div>
              ) : (
                <Link href="/register" className={`w-full text-center text-sm font-medium py-2 rounded-lg transition-colors ${
                  plan.highlight ? "bg-white text-blue-600 hover:bg-blue-50" : "bg-zinc-900 text-white hover:bg-zinc-700"
                }`}>
                  Upgrade
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-zinc-400 text-center">
        Paid plans coming soon. Questions? Contact us at{" "}
        <a href="mailto:hello@evokira.in" className="text-blue-500 hover:underline">hello@evokira.in</a>
      </p>
    </div>
  )
}
