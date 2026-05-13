"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { PageHeader } from "@/components/page-header"
import { formatDate } from "@/lib/utils"
import { Calendar, Loader2, Search, Clock, CheckCircle, XCircle } from "lucide-react"

const statusColors: Record<string, string> = {
  pending:   "bg-amber-50 text-amber-700 border border-amber-200",
  confirmed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  completed: "bg-blue-50 text-blue-700 border border-blue-200",
  cancelled: "bg-red-50 text-red-700 border border-red-200",
}

export default function BookingsPage() {
  const { data: session } = useSession()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN"

  useEffect(() => {
    if (!session) return
    fetch("/api/bookings?limit=200")
      .then(r => r.json())
      .then(d => { setBookings(Array.isArray(d) ? d : d.bookings ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [session])

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/bookings/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    setBookings(b => b.map(x => x.id === id ? { ...x, status } : x))
  }

  const filtered = bookings.filter(b => {
    const matchSearch = !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.email.toLowerCase().includes(search.toLowerCase()) || b.service?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "ALL" || b.status === statusFilter
    return matchSearch && matchStatus
  })

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === "pending").length,
    confirmed: bookings.filter(b => b.status === "confirmed").length,
    completed: bookings.filter(b => b.status === "completed").length,
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Bookings" description="Manage appointments and reservations" icon={Calendar} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, color: "text-zinc-900" },
          { label: "Pending", value: stats.pending, color: "text-amber-600" },
          { label: "Confirmed", value: stats.confirmed, color: "text-emerald-600" },
          { label: "Completed", value: stats.completed, color: "text-blue-600" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-zinc-200 rounded-xl p-4">
            <p className="text-xs text-zinc-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input type="text" placeholder="Search by name, email or service..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["ALL", "pending", "confirmed", "completed", "cancelled"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${statusFilter === s ? "bg-zinc-900 text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}>
              {s === "ALL" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Client</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Service</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Date & Time</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Status</th>
              {isSuperAdmin && <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Workspace</th>}
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-16">
                <Loader2 className="w-5 h-5 animate-spin text-zinc-300 mx-auto mb-2" />
                <p className="text-sm text-zinc-400">Loading bookings...</p>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-16">
                <Calendar className="w-8 h-8 text-zinc-200 mx-auto mb-3" />
                <p className="text-sm text-zinc-400">{search || statusFilter !== "ALL" ? "No bookings match your filters" : "No bookings yet"}</p>
              </td></tr>
            ) : filtered.map(booking => (
              <tr key={booking.id} className="hover:bg-zinc-50 transition-colors group">
                <td className="px-5 py-3.5">
                  <p className="font-medium text-zinc-900">{booking.name}</p>
                  <p className="text-xs text-zinc-400">{booking.email}</p>
                  {booking.phone && <p className="text-xs text-zinc-400">{booking.phone}</p>}
                </td>
                <td className="px-5 py-3.5 text-zinc-600">{booking.service ?? "—"}</td>
                <td className="px-5 py-3.5">
                  <p className="text-zinc-900">{formatDate(booking.date)}</p>
                  {booking.timeSlot && <p className="text-xs text-zinc-400">{booking.timeSlot}</p>}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[booking.status] ?? "bg-zinc-100 text-zinc-600"}`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </td>
                {isSuperAdmin && <td className="px-5 py-3.5 text-xs text-zinc-500">{booking.workspace?.name}</td>}
                <td className="px-5 py-3.5 text-right">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 justify-end">
                    {booking.status === "pending" && (
                      <button onClick={() => updateStatus(booking.id, "confirmed")} title="Confirm"
                        className="p-1.5 rounded-lg hover:bg-emerald-50 text-zinc-400 hover:text-emerald-600 transition-colors">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    {booking.status !== "cancelled" && booking.status !== "completed" && (
                      <button onClick={() => updateStatus(booking.id, "cancelled")} title="Cancel"
                        className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors">
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50 text-xs text-zinc-400">
            Showing {filtered.length} of {bookings.length} bookings
          </div>
        )}
      </div>
    </div>
  )
}
