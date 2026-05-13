"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { CheckCircle, Palette, Loader2 } from "lucide-react"

const FONTS = ["Inter", "Roboto", "Poppins", "Playfair Display", "Montserrat", "Open Sans", "Lato", "Nunito"]

export default function ThemePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    primaryColor: "#18181b", secondaryColor: "#ffffff", accentColor: "#3b82f6",
    fontHeading: "Inter", fontBody: "Inter", logo: "", favicon: "",
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    fetch("/api/theme").then(r => r.json()).then(d => {
      if (d) setForm({ primaryColor: d.primaryColor, secondaryColor: d.secondaryColor, accentColor: d.accentColor, fontHeading: d.fontHeading, fontBody: d.fontBody, logo: d.logo ?? "", favicon: d.favicon ?? "" })
      setLoading(false)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch("/api/theme", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-zinc-300" /></div>

  return (
    <div className="space-y-6">
      <PageHeader title="Theme" description="Customize your website's appearance" icon={Palette} />
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-5">
          <h2 className="font-semibold text-zinc-900">Brand Colors</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { key: "primaryColor", label: "Primary Color" },
              { key: "secondaryColor", label: "Secondary Color" },
              { key: "accentColor", label: "Accent Color" },
            ].map(({ key, label }) => (
              <div key={key} className="space-y-1.5">
                <Label>{label}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form[key as keyof typeof form]}
                    onChange={e => set(key, e.target.value)}
                    className="w-9 h-9 rounded-lg border border-zinc-200 cursor-pointer p-0.5"
                  />
                  <Input value={form[key as keyof typeof form]} onChange={e => set(key, e.target.value)} className="font-mono text-xs" />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 mt-4 p-4 rounded-lg border border-zinc-100">
            <div className="w-8 h-8 rounded" style={{ background: form.primaryColor }} />
            <div className="w-8 h-8 rounded border border-zinc-200" style={{ background: form.secondaryColor }} />
            <div className="w-8 h-8 rounded" style={{ background: form.accentColor }} />
            <span className="text-xs text-zinc-400 ml-1">Color preview</span>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-zinc-900">Typography</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Heading Font</Label>
              <select value={form.fontHeading} onChange={e => set("fontHeading", e.target.value)} className="w-full h-9 px-3 rounded-md border border-input text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring">
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Body Font</Label>
              <select value={form.fontBody} onChange={e => set("fontBody", e.target.value)} className="w-full h-9 px-3 rounded-md border border-input text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring">
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-zinc-900">Brand Assets</h2>
          <div className="space-y-1.5">
            <Label>Logo URL</Label>
            <Input value={form.logo} onChange={e => set("logo", e.target.value)} placeholder="https://... or /uploads/logo.png" />
          </div>
          <div className="space-y-1.5">
            <Label>Favicon URL</Label>
            <Input value={form.favicon} onChange={e => set("favicon", e.target.value)} placeholder="https://... or /uploads/favicon.ico" />
          </div>
        </div>

        <Button type="submit" disabled={saving} className="gap-2">
          {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : saving ? "Saving…" : "Save Theme"}
        </Button>
      </form>
    </div>
  )
}
