"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Plus, Ticket, Trash2, Loader2 } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/coupons").then(r => r.json()).then(data => {
      setCoupons(data)
      setLoading(false)
    })
  }, [])

  async function deleteCoupon(id: string) {
    if (!confirm("Delete this coupon?")) return
    await fetch(`/api/coupons/${id}`, { method: "DELETE" })
    setCoupons(coupons.filter(c => c.id !== id))
  }

  async function toggleCoupon(id: string, active: boolean) {
    await fetch(`/api/coupons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    })
    setCoupons(coupons.map(c => c.id === id ? { ...c, active: !active } : c))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coupons"
        description="Manage discount codes for your store"
        icon={Ticket}
        action={
          <Link href="/coupons/new" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Create Coupon
          </Link>
        }
      />

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase">Code</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase">Discount</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase">Usage</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase">Expiry</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-16">
                  <Loader2 className="w-5 h-5 animate-spin text-zinc-300 mx-auto mb-2" />
                  <p className="text-sm text-zinc-400">Loading coupons...</p>
                </td>
              </tr>
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16">
                  <Ticket className="w-8 h-8 text-zinc-200 mx-auto mb-3" />
                  <p className="text-sm text-zinc-400 mb-2">No coupons created yet</p>
                  <Link href="/coupons/new" className="text-sm text-blue-600 hover:underline font-medium">Create your first coupon →</Link>
                </td>
              </tr>
            ) : (
              coupons.map(coupon => (
                <tr key={coupon.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="font-mono font-bold text-zinc-900">{coupon.code}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-medium">
                      {coupon.discountType === "PERCENTAGE" ? `${coupon.amount}%` : formatCurrency(coupon.amount)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-zinc-600">{coupon.usageCount} / {coupon.usageLimit ?? "∞"}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button 
                      onClick={() => toggleCoupon(coupon.id, coupon.active)}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${coupon.active ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}
                    >
                      {coupon.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-zinc-400">
                    {coupon.expiryDate ? formatDate(coupon.expiryDate) : "Never"}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={() => deleteCoupon(coupon.id)} className="text-zinc-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}
