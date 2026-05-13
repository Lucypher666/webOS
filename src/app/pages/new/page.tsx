"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MediaPicker } from "@/components/media-picker"
import { Image as ImageIcon } from "lucide-react"

export default function NewPagePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [form, setForm] = useState({
    title: "", heroTitle: "", heroSubtitle: "", heroImage: "",
    section1Title: "", section1Body: "", section2Title: "", section2Body: "",
    ctaText: "", ctaLink: "", seoTitle: "", seoDesc: "", status: "DRAFT",
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const content = {
      heroTitle: form.heroTitle, heroSubtitle: form.heroSubtitle, heroImage: form.heroImage,
      section1: { title: form.section1Title, body: form.section1Body },
      section2: { title: form.section2Title, body: form.section2Body },
      cta: { text: form.ctaText, link: form.ctaLink },
    }
    await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: form.title, content, seoTitle: form.seoTitle, seoDesc: form.seoDesc, status: form.status }),
    })
    setLoading(false)
    router.push("/pages")
  }

  return (
    <div>
      <PageHeader title="New Page" description="Create a new website page" />
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-zinc-900">Page Info</h2>
          <div className="space-y-1.5">
            <Label>Page Title *</Label>
            <Input required value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. About Us" />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-zinc-900">Hero Section</h2>
          <div className="space-y-1.5"><Label>Hero Title</Label><Input value={form.heroTitle} onChange={e => set("heroTitle", e.target.value)} placeholder="Main headline" /></div>
          <div className="space-y-1.5"><Label>Hero Subtitle</Label><Textarea rows={2} value={form.heroSubtitle} onChange={e => set("heroSubtitle", e.target.value)} placeholder="Supporting text" /></div>
          <div className="space-y-1.5">
            <Label>Hero Image URL</Label>
            <div className="flex gap-2">
              <Input value={form.heroImage} onChange={e => set("heroImage", e.target.value)} placeholder="https://..." />
              <Button type="button" variant="outline" size="icon" onClick={() => setPickerOpen(true)}>
                <ImageIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-zinc-900">Content Sections</h2>
          <div className="space-y-1.5"><Label>Section 1 Title</Label><Input value={form.section1Title} onChange={e => set("section1Title", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Section 1 Body</Label><Textarea rows={4} value={form.section1Body} onChange={e => set("section1Body", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Section 2 Title</Label><Input value={form.section2Title} onChange={e => set("section2Title", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Section 2 Body</Label><Textarea rows={4} value={form.section2Body} onChange={e => set("section2Body", e.target.value)} /></div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-zinc-900">Call to Action</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Button Text</Label><Input value={form.ctaText} onChange={e => set("ctaText", e.target.value)} placeholder="Get Started" /></div>
            <div className="space-y-1.5"><Label>Button Link</Label><Input value={form.ctaLink} onChange={e => set("ctaLink", e.target.value)} placeholder="/contact" /></div>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-zinc-900">SEO</h2>
          <div className="space-y-1.5"><Label>SEO Title</Label><Input value={form.seoTitle} onChange={e => set("seoTitle", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>SEO Description</Label><Textarea rows={2} value={form.seoDesc} onChange={e => set("seoDesc", e.target.value)} /></div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Save Page"}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>

      <MediaPicker 
        open={pickerOpen} 
        onOpenChange={setPickerOpen} 
        onSelect={(urls) => set("heroImage", urls[0])}
      />
    </div>
  )
}
