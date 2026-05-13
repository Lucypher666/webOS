"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { PageHeader } from "@/components/page-header"
import Link from "next/link"
import { ShoppingCart, Search, Filter, Loader2, ExternalLink, TrendingUp, Clock, CheckCircle, Download } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
}

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  total: number
  subtotal: number
  discount: number
  status: string
  paymentStatus: string
  createdAt: string
  items: OrderItem[]
  workspace?: { name: string }
}

const statusColors: Record<string, string> = {
  PENDING:    "bg-amber-50 text-amber-700 border border-amber-200",
  CONFIRMED:  "bg-blue-50 text-blue-700 border border-blue-200",
  PROCESSING: "bg-purple-50 text-purple-700 border border-purple-200",
  SHIPPED:    "bg-indigo-50 text-indigo-700 border border-indigo-200",
  DELIVERED:  "bg-emerald-50 text-emerald-700 border border-emerald-200",
  CANCELLED:  "bg-red-50 text-red-700 border border-red-200",
  REFUNDED:   "bg-zinc-100 text-zinc-600 border border-zinc-200",
}

const paymentColors: Record<string, string> = {
  PAID:    "text-emerald-600",
  PENDING: "text-amber-600",
  FAILED:  "text-red-500",
}

const ALL_STATUSES = ["ALL", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]

export default function OrdersPage() {
  const { data: session } = useSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN"

  useEffect(() => {
    if (!session) return
    fetch("/api/orders?limit=200")
      .then(r => r.json())
      .then(d => { setOrders(d.orders ?? d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [session])

  const filtered = orders.filter(o => {
    const matchSearch = !search ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.customerEmail.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "ALL" || o.status === statusFilter
    return matchSearch && matchStatus
  })

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "PENDING").length,
    processing: orders.filter(o => ["CONFIRMED", "PROCESSING", "SHIPPED"].includes(o.status)).length,
    delivered: orders.filter(o => o.status === "DELIVERED").length,
    revenue: orders.reduce((s, o) => s + o.total, 0),
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Track and manage customer orders"
        icon={ShoppingCart}
        action={
          <a href="/api/export?type=orders" download className="inline-flex items-center gap-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </a>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: stats.total, color: "text-zinc-900", icon: ShoppingCart },
          { label: "Pending", value: stats.pending, color: "text-amber-600", icon: Clock },
          { label: "In Progress", value: stats.processing, color: "text-blue-600", icon: TrendingUp },
          { label: "Delivered", value: stats.delivered, color: "text-emerald-600", icon: CheckCircle },
        ].map(s => (
          <div key={s.label} className="bg-white border border-zinc-200 rounded-xl p-4">
            <p className="text-xs text-zinc-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by order #, customer name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-zinc-400 shrink-0" />
          {["ALL", "PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === s ? "bg-zinc-900 text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Order</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Customer</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Items</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Total</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Payment</th>
              {isSuperAdmin && <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Workspace</th>}
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Date</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-16">
                  <Loader2 className="w-5 h-5 animate-spin text-zinc-300 mx-auto mb-2" />
                  <p className="text-sm text-zinc-400">Loading orders...</p>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-16">
                  <ShoppingCart className="w-8 h-8 text-zinc-200 mx-auto mb-3" />
                  <p className="text-sm text-zinc-400">
                    {search || statusFilter !== "ALL" ? "No orders match your filters" : "No orders yet"}
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map(order => (
                <tr key={order.id} className="hover:bg-zinc-50 transition-colors group">
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-xs font-semibold text-zinc-900">{order.orderNumber}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-zinc-900 text-sm">{order.customerName}</p>
                    <p className="text-xs text-zinc-400">{order.customerEmail}</p>
                  </td>
                  <td className="px-5 py-3.5 text-zinc-500 text-sm">
                    {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-semibold text-zinc-900">{formatCurrency(order.total)}</span>
                    {order.discount > 0 && (
                      <span className="text-xs text-emerald-600 ml-1">−{formatCurrency(order.discount)}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[order.status] ?? "bg-zinc-100 text-zinc-600"}`}>
                      {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium ${paymentColors[order.paymentStatus] ?? "text-zinc-500"}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  {isSuperAdmin && (
                    <td className="px-5 py-3.5 text-xs text-zinc-500">{order.workspace?.name}</td>
                  )}
                  <td className="px-5 py-3.5 text-xs text-zinc-400">{formatDate(order.createdAt)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/orders/${order.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Details
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        </div>
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50 text-xs text-zinc-400">
            Showing {filtered.length} of {orders.length} orders
            {stats.revenue > 0 && (
              <span className="ml-3 font-medium text-zinc-600">
                Total revenue: {formatCurrency(stats.revenue)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
