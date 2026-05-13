import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { StatCard } from "@/components/stat-card"
import { PageHeader } from "@/components/page-header"
import { Package, ShoppingCart, TrendingUp, DollarSign } from "lucide-react"
import { formatDate, formatCurrency } from "@/lib/utils"
import { SalesChart } from "@/components/sales-chart"
import Link from "next/link"

function getLast7Days() {
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    d.setHours(0, 0, 0, 0)
    return d
  })
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN"
  const workspaceId = session?.user?.workspaceId

  const where = isSuperAdmin ? {} : { workspaceId: workspaceId ?? "__none__" }

  const [products, orders, revenueData, prevPeriodRevenue] = await Promise.all([
    prisma.product.count({ where }),
    prisma.order.count({ where }),
    prisma.order.aggregate({ where, _sum: { total: true } }),
    // Previous 30-day revenue for growth calculation
    prisma.order.aggregate({
      where: {
        ...where,
        createdAt: {
          gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      _sum: { total: true },
    }),
  ])

  const revenue = revenueData._sum.total ?? 0
  const prevRevenue = prevPeriodRevenue._sum.total ?? 0
  const growth = prevRevenue === 0 ? null : ((revenue - prevRevenue) / prevRevenue) * 100

  const recentOrders = await prisma.order.findMany({
    where,
    take: 5,
    orderBy: { createdAt: "desc" },
    include: isSuperAdmin ? { workspace: { select: { name: true } } } : undefined,
  })

  // Real 7-day chart data grouped by day
  const days = getLast7Days()
  const chartStart = days[0]
  const chartEnd = new Date()
  chartEnd.setHours(23, 59, 59, 999)

  const ordersInRange = await prisma.order.findMany({
    where: { ...where, createdAt: { gte: chartStart, lte: chartEnd } },
    select: { total: true, createdAt: true },
  })

  const chartData = days.map(day => {
    const dayEnd = new Date(day)
    dayEnd.setHours(23, 59, 59, 999)
    const dayTotal = ordersInRange
      .filter(o => o.createdAt >= day && o.createdAt <= dayEnd)
      .reduce((sum, o) => sum + o.total, 0)
    return {
      name: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      total: dayTotal,
    }
  })

  const statusColors: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700",
    CONFIRMED: "bg-blue-100 text-blue-700",
    DELIVERED: "bg-emerald-100 text-emerald-700",
    CANCELLED: "bg-red-100 text-red-700",
    PROCESSING: "bg-purple-100 text-purple-700",
    SHIPPED: "bg-indigo-100 text-indigo-700",
    REFUNDED: "bg-zinc-100 text-zinc-700",
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${session?.user?.name ?? "there"}`}
        description={isSuperAdmin ? "Platform-wide overview" : `Managing ${session?.user?.workspaceName ?? "your workspace"}`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard title="Total Revenue" value={formatCurrency(revenue)} icon={DollarSign} color="green" />
        <StatCard title="Total Orders" value={orders} icon={ShoppingCart} color="blue" />
        <StatCard title="Total Products" value={products} icon={Package} color="orange" />
        <StatCard
          title="Revenue Growth"
          value={growth === null ? "N/A" : `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-zinc-900">Sales — Last 7 Days</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Revenue from completed orders</p>
            </div>
          </div>
          <SalesChart data={chartData} type="line" />
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl flex flex-col">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="font-semibold text-zinc-900">Recent Orders</h2>
            <Link href="/orders" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6 text-sm text-zinc-400">No orders yet</div>
          ) : (
            <div className="divide-y divide-zinc-100 overflow-y-auto">
              {recentOrders.map((order: any) => (
                <div key={order.id} className="px-6 py-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">{order.orderNumber}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{order.customerName}</p>
                    <p className="text-[10px] text-zinc-400">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-zinc-900">{formatCurrency(order.total)}</p>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusColors[order.status] ?? "bg-zinc-100 text-zinc-700"}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
