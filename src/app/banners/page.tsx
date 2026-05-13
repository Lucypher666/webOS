"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Trash2, Plus, GripVertical, Image as ImageIcon, Megaphone, Loader2 } from "lucide-react"
import { MediaPicker } from "@/components/media-picker"

interface Banner {
  id: string
  title: string
  subtitle: string | null
  image: string | null
  link: string | null
  buttonText: string | null
  active: boolean
  order: number
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [form, setForm] = useState({ title: "", subtitle: "", image: "", link: "", buttonText: "" })

  useEffect(() => {
    fetch("/api/banners").then(r => r.json()).then(data => { setBanners(data); setLoading(false) })
  }, [])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function addBanner() {
    const res = await fetch("/api/banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const banner = await res.json()
    setBanners(b => [...b, banner])
    setForm({ title: "", subtitle: "", image: "", link: "", buttonText: "" })
    setAdding(false)
  }

  async function deleteBanner(id: string) {
    await fetch(`/api/banners/${id}`, { method: "DELETE" })
    setBanners(b => b.filter(x => x.id !== id))
  }

  async function toggleBanner(id: string, active: boolean) {
    await fetch(`/api/banners/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    })
    setBanners(b => b.map(x => x.id === id ? { ...x, active: !active } : x))
  }

  return (
    <div>
      <PageHeader
        title="Banners"
        description="Manage homepage banners and promotions"
        icon={Megaphone}
        action={
          <Button size="sm" onClick={() => setAdding(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Add Banner
          </Button>
        }
      />

      {adding && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 mb-6 space-y-4">
          <h2 className="font-semibold text-zinc-900">New Banner</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Title *</Label><Input required value={form.title} onChange={e => set("title", e.target.value)} placeholder="Banner headline" /></div>
            <div className="space-y-1.5"><Label>Subtitle</Label><Input value={form.subtitle} onChange={e => set("subtitle", e.target.value)} placeholder="Supporting text" /></div>
            <div className="space-y-1.5">
              <Label>Image URL</Label>
              <div className="flex gap-2">
                <Input value={form.image} onChange={e => set("image", e.target.value)} placeholder="https://..." />
                <Button type="button" variant="outline" size="icon" onClick={() => setPickerOpen(true)}>
                  <ImageIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Link</Label><Input value={form.link} onChange={e => set("link", e.target.value)} placeholder="/shop" /></div>
            <div className="space-y-1.5"><Label>Button Text</Label><Input value={form.buttonText} onChange={e => set("buttonText", e.target.value)} placeholder="Shop Now" /></div>
          </div>
          <div className="flex gap-3">
            <Button onClick={addBanner} disabled={!form.title}>Save Banner</Button>
            <Button variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-zinc-200 rounded-xl py-16 text-center">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-300 mx-auto mb-2" />
          <p className="text-sm text-zinc-400">Loading banners...</p>
        </div>
      ) : banners.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl py-16 text-center">
          <Megaphone className="w-8 h-8 text-zinc-200 mx-auto mb-3" />
          <p className="text-sm text-zinc-400 mb-2">No banners yet</p>
          <button onClick={() => setAdding(true)} className="text-sm text-blue-600 hover:underline font-medium">Add your first banner →</button>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map(banner => (
            <div key={banner.id} className="bg-white border border-zinc-200 rounded-xl p-5 flex items-center gap-4">
              <GripVertical className="w-4 h-4 text-zinc-300 shrink-0" />
              {banner.image && (
                <img src={banner.image} alt={banner.title} className="w-16 h-10 object-cover rounded-lg shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-zinc-900">{banner.title}</p>
                {banner.subtitle && <p className="text-sm text-zinc-500 truncate">{banner.subtitle}</p>}
                {banner.link && <p className="text-xs text-blue-500 mt-0.5">{banner.link}</p>}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleBanner(banner.id, banner.active)}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${banner.active ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"}`}
                >
                  {banner.active ? "Active" : "Inactive"}
                </button>
                <button onClick={() => deleteBanner(banner.id)} className="text-zinc-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <MediaPicker 
        open={pickerOpen} 
        onOpenChange={setPickerOpen} 
        onSelect={(urls) => set("image", urls[0])}
      />
    </div>
  )
}
