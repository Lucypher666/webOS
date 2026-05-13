"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Plus, Gift, Trash2, Loader2 } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

export default function GiftCardsPage() {
  const [giftCards, setGiftCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/gift-cards").then(r => r.json()).then(data => {
      setGiftCards(data)
      setLoading(false)
    })
  }, [])

  async function deleteGiftCard(id: string) {
    if (!confirm("Delete this gift card?")) return
    await fetch(`/api/gift-cards/${id}`, { method: "DELETE" })
    setGiftCards(giftCards.filter(c => c.id !== id))
  }

  async function toggleGiftCard(id: string, active: boolean) {
    await fetch(`/api/gift-cards/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    })
    setGiftCards(giftCards.map(c => c.id === id ? { ...c, active: !active } : c))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gift Cards"
        description="Issue and manage gift cards for your customers"
        icon={Gift}
        action={
          <Link href="/gift-cards/new" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Issue Gift Card
          </Link>
        }
      />

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase">Code</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase">Initial Value</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase">Balance</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase">Expiry</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-16"><Loader2 className="w-5 h-5 animate-spin text-zinc-300 mx-auto mb-2" /><p className="text-sm text-zinc-400">Loading...</p></td></tr>
            ) : giftCards.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16">
                  <Gift className="w-8 h-8 text-zinc-200 mx-auto mb-3" />
                  <p className="text-sm text-zinc-400 mb-2">No gift cards issued yet</p>
                  <Link href="/gift-cards/new" className="text-sm text-blue-600 hover:underline font-medium">Issue your first gift card →</Link>
                </td>
              </tr>
            ) : (
              giftCards.map(card => (
                <tr key={card.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="font-mono font-bold text-zinc-900">{card.code}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-zinc-600">{formatCurrency(card.initialValue)}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-bold text-zinc-900">{formatCurrency(card.balance)}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button 
                      onClick={() => toggleGiftCard(card.id, card.active)}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${card.active && card.balance > 0 ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}
                    >
                      {card.active ? (card.balance > 0 ? "Active" : "Depleted") : "Inactive"}
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-zinc-400">
                    {card.expiryDate ? formatDate(card.expiryDate) : "Never"}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={() => deleteGiftCard(card.id)} className="text-zinc-400 hover:text-red-600">
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
