"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function NewGiftCardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    code: "", amount: "", expiryDate: "", active: true,
  })

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

  const generateCode = () => {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase()
    set("code", code)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch("/api/gift-cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setLoading(false)
    if (res.ok) router.push("/gift-cards")
  }

  return (
    <div>
      <PageHeader title="Issue Gift Card" description="Create a new gift card balance" />
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
          <div className="space-y-1.5">
            <Label>Gift Card Code *</Label>
            <div className="flex gap-2">
              <Input required value={form.code} onChange={e => set("code", e.target.value.toUpperCase())} className="font-mono" placeholder="XXXX-XXXX" />
              <Button type="button" variant="outline" onClick={generateCode}>Generate</Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Initial Amount ($) *</Label>
            <Input required type="number" step="0.01" value={form.amount} onChange={e => set("amount", e.target.value)} placeholder="0.00" />
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-zinc-900">Expiration</h2>
          <div className="space-y-1.5">
            <Label>Expiry Date</Label>
            <Input type="date" value={form.expiryDate} onChange={e => set("expiryDate", e.target.value)} />
            <p className="text-xs text-zinc-400">Leave blank for no expiration</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>{loading ? "Issuing…" : "Issue Gift Card"}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
