import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/page-header"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Users, ShoppingBag } from "lucide-react"

export default async function CustomersPage() {
  const session = await getServerSession(authOptions)
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN"
  const where = isSuperAdmin ? {} : { workspaceId: session?.user?.workspaceId ?? "__none__" }

  const orders = await prisma.order.findMany({
    where,
    select: { customerName: true, customerEmail: true, customerPhone: true, total: true, createdAt: true, status: true },
    orderBy: { createdAt: "desc" },
  })

  // Group by email to build customer list
  const customerMap = new Map<string, {
    name: string; email: string; phone: string | null;
    totalSpent: number; orderCount: number; lastOrder: Date;
  }>()

  for (const o of orders) {
    const existing = customerMap.get(o.customerEmail)
    if (existing) {
      existing.totalSpent += o.total
      existing.orderCount += 1
      if (o.createdAt > existing.lastOrder) existing.lastOrder = o.createdAt
    } else {
      customerMap.set(o.customerEmail, {
        name: o.customerName, email: o.customerEmail, phone: o.customerPhone,
        totalSpent: o.total, orderCount: 1, lastOrder: o.createdAt,
      })
    }
  }

  const customers = Array.from(customerMap.values()).sort((a, b) => b.totalSpent - a.totalSpent)
  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0)

  return (
    <div className="space-y-6">
      <PageHeader title="Customers" description="Everyone who has placed an order" icon={Users} />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "Total Customers", value: customers.length, color: "text-zinc-900" },
          { label: "Total Revenue", value: formatCurrency(totalRevenue), color: "text-emerald-600" },
          { label: "Avg. Order Value", value: customers.length ? formatCurrency(totalRevenue / orders.length) : "—", color: "text-blue-600" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-zinc-200 rounded-xl p-4">
            <p className="text-xs text-zinc-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Customer</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Orders</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Total Spent</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Last Order</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {customers.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-16">
                <Users className="w-8 h-8 text-zinc-200 mx-auto mb-3" />
                <p className="text-sm text-zinc-400">No customers yet — they appear here once orders are placed</p>
              </td></tr>
            ) : customers.map(c => (
              <tr key={c.email} className="hover:bg-zinc-50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-blue-700">{c.name[0].toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900">{c.name}</p>
                      <p className="text-xs text-zinc-400">{c.email}</p>
                      {c.phone && <p className="text-xs text-zinc-400">{c.phone}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5 text-zinc-600">
                    <ShoppingBag className="w-3.5 h-3.5 text-zinc-400" />
                    {c.orderCount} order{c.orderCount !== 1 ? "s" : ""}
                  </div>
                </td>
                <td className="px-5 py-3.5 font-semibold text-zinc-900">{formatCurrency(c.totalSpent)}</td>
                <td className="px-5 py-3.5 text-zinc-400 text-xs">{formatDate(c.lastOrder)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length > 0 && (
          <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50 text-xs text-zinc-400">
            {customers.length} unique customer{customers.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  )
}
