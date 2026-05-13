"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { CheckCircle, Settings, Globe, Phone, Share2, Code2, Copy, Check } from "lucide-react"

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState({
    siteName: "", siteUrl: "", contactEmail: "", contactPhone: "", address: "",
    currency: "USD", timezone: "UTC",
    facebook: "", instagram: "", twitter: "", linkedin: "", youtube: "",
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(d => {
      if (d) {
        const social = (d.socialLinks as any) ?? {}
        setForm({
          siteName: d.siteName ?? "", siteUrl: d.siteUrl ?? "", contactEmail: d.contactEmail ?? "",
          contactPhone: d.contactPhone ?? "", address: d.address ?? "",
          currency: d.currency ?? "USD", timezone: d.timezone ?? "UTC",
          facebook: social.facebook ?? "", instagram: social.instagram ?? "",
          twitter: social.twitter ?? "", linkedin: social.linkedin ?? "", youtube: social.youtube ?? "",
        })
      }
      setLoading(false)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { facebook, instagram, twitter, linkedin, youtube, ...rest } = form
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...rest, socialLinks: { facebook, instagram, twitter, linkedin, youtube } }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function copyEndpoint() {
    navigator.clipboard.writeText(`${window.location.origin}/api/graphql`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-5 h-5 border-2 border-zinc-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Configure your workspace settings" icon={Settings} />

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {/* General */}
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-2">
            <Globe className="w-4 h-4 text-zinc-400" />
            <h2 className="font-semibold text-zinc-900">General</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label>Site Name <span className="text-red-400">*</span></Label>
              <Input required value={form.siteName} onChange={e => set("siteName", e.target.value)} placeholder="My Awesome Store" />
            </div>
            <div className="space-y-1.5">
              <Label>Site URL</Label>
              <Input value={form.siteUrl} onChange={e => set("siteUrl", e.target.value)} placeholder="https://yoursite.com" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <select value={form.currency} onChange={e => set("currency", e.target.value)} className="w-full h-9 px-3 rounded-lg border border-zinc-200 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {["USD","EUR","GBP","INR","AUD","CAD"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Timezone</Label>
                <select value={form.timezone} onChange={e => set("timezone", e.target.value)} className="w-full h-9 px-3 rounded-lg border border-zinc-200 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {["UTC","America/New_York","America/Los_Angeles","Europe/London","Asia/Kolkata","Asia/Tokyo","Australia/Sydney"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-2">
            <Phone className="w-4 h-4 text-zinc-400" />
            <h2 className="font-semibold text-zinc-900">Contact Info</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.contactEmail} onChange={e => set("contactEmail", e.target.value)} placeholder="hello@yoursite.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.contactPhone} onChange={e => set("contactPhone", e.target.value)} placeholder="+1 (555) 000-0000" />
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input value={form.address} onChange={e => set("address", e.target.value)} placeholder="123 Main St, City, Country" />
            </div>
          </div>
        </div>

        {/* Social */}
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-zinc-400" />
            <h2 className="font-semibold text-zinc-900">Social Links</h2>
          </div>
          <div className="p-6 space-y-4">
            {[
              { key: "facebook",  placeholder: "https://facebook.com/yourpage" },
              { key: "instagram", placeholder: "https://instagram.com/yourhandle" },
              { key: "twitter",   placeholder: "https://twitter.com/yourhandle" },
              { key: "linkedin",  placeholder: "https://linkedin.com/company/yourco" },
              { key: "youtube",   placeholder: "https://youtube.com/@yourchannel" },
            ].map(({ key, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <Label className="capitalize">{key}</Label>
                <Input value={form[key as keyof typeof form]} onChange={e => set(key, e.target.value)} placeholder={placeholder} />
              </div>
            ))}
          </div>
        </div>

        {/* API */}
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-zinc-400" />
            <h2 className="font-semibold text-zinc-900">Headless API</h2>
          </div>
          <div className="p-6 space-y-3">
            <p className="text-sm text-zinc-500">Connect your workspace to any website or app using our GraphQL API.</p>
            <div className="flex gap-2">
              <Input readOnly value={`${typeof window !== "undefined" ? window.location.origin : ""}/api/graphql`} className="bg-zinc-50 font-mono text-xs text-zinc-600" />
              <Button type="button" variant="outline" size="sm" onClick={copyEndpoint} className="gap-1.5 shrink-0">
                {copied ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
              </Button>
            </div>
            <p className="text-xs text-zinc-400">Use this endpoint to fetch your products, settings and content from any frontend.</p>
          </div>
        </div>

        <Button type="submit" disabled={saving} className="gap-2 w-full sm:w-auto">
          {saved
            ? <><CheckCircle className="w-4 h-4" /> Saved!</>
            : saving ? "Saving…" : "Save Settings"
          }
        </Button>
      </form>
    </div>
  )
}
