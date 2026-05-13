"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { CheckCircle, Search, Loader2 } from "lucide-react"

export default function SeoPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    metaTitle: "", metaDesc: "", ogImage: "", googleAnalyticsId: "", robots: "index, follow",
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    fetch("/api/seo").then(r => r.json()).then(d => {
      if (d) setForm({ metaTitle: d.metaTitle ?? "", metaDesc: d.metaDesc ?? "", ogImage: d.ogImage ?? "", googleAnalyticsId: d.googleAnalyticsId ?? "", robots: d.robots ?? "index, follow" })
      setLoading(false)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch("/api/seo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-zinc-300" /></div>

  return (
    <div className="space-y-6">
      <PageHeader title="SEO" description="Optimize your site for search engines" icon={Search} />
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-zinc-900">Meta Tags</h2>
          <div className="space-y-1.5">
            <Label>Meta Title</Label>
            <Input value={form.metaTitle} onChange={e => set("metaTitle", e.target.value)} placeholder="Your site name – tagline" />
            <p className="text-xs text-zinc-400">Recommended: 50–60 characters ({form.metaTitle.length})</p>
          </div>
          <div className="space-y-1.5">
            <Label>Meta Description</Label>
            <Textarea rows={3} value={form.metaDesc} onChange={e => set("metaDesc", e.target.value)} placeholder="Brief description of your site…" />
            <p className="text-xs text-zinc-400">Recommended: 150–160 characters ({form.metaDesc.length})</p>
          </div>
          <div className="space-y-1.5">
            <Label>OG / Social Image URL</Label>
            <Input value={form.ogImage} onChange={e => set("ogImage", e.target.value)} placeholder="https://..." />
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-zinc-900">Analytics & Crawling</h2>
          <div className="space-y-1.5">
            <Label>Google Analytics ID</Label>
            <Input value={form.googleAnalyticsId} onChange={e => set("googleAnalyticsId", e.target.value)} placeholder="G-XXXXXXXXXX" />
          </div>
          <div className="space-y-1.5">
            <Label>Robots Directive</Label>
            <Input value={form.robots} onChange={e => set("robots", e.target.value)} placeholder="index, follow" />
          </div>
        </div>

        <Button type="submit" disabled={saving} className="gap-2">
          {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : saving ? "Saving…" : "Save SEO Settings"}
        </Button>
      </form>
    </div>
  )
}
