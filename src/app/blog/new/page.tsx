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

export default function NewPostPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [form, setForm] = useState({
    title: "", excerpt: "", content: "", author: "", category: "", tags: "", status: "DRAFT", coverImage: "",
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, tags: form.tags.split(",").map(t => t.trim()).filter(Boolean) }),
    })
    setLoading(false)
    if (res.ok) router.push("/blog")
  }

  return (
    <div>
      <PageHeader title="New Post" description="Write a new blog post" />
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-zinc-900">Post Details</h2>
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input required value={form.title} onChange={e => set("title", e.target.value)} placeholder="Post title" />
          </div>
          <div className="space-y-1.5">
            <Label>Cover Image</Label>
            <div className="flex gap-2">
              <Input value={form.coverImage} onChange={e => set("coverImage", e.target.value)} placeholder="https://..." />
              <Button type="button" variant="outline" size="icon" onClick={() => setPickerOpen(true)}>
                <ImageIcon className="w-4 h-4" />
              </Button>
            </div>
            {form.coverImage && (
              <img src={form.coverImage} alt="Cover preview" className="w-full h-32 object-cover rounded-lg border border-zinc-100" />
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Excerpt</Label>
            <Textarea rows={2} value={form.excerpt} onChange={e => set("excerpt", e.target.value)} placeholder="Short summary..." />
          </div>
          <div className="space-y-1.5">
            <Label>Content *</Label>
            <Textarea required rows={10} value={form.content} onChange={e => set("content", e.target.value)} placeholder="Write your post content here..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Author</Label>
              <Input value={form.author} onChange={e => set("author", e.target.value)} placeholder="Author name" />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input value={form.category} onChange={e => set("category", e.target.value)} placeholder="e.g. News" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Tags (comma separated)</Label>
            <Input value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="e.g. tips, guide" />
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
        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>{loading ? "Publishing…" : "Publish Post"}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>

      <MediaPicker 
        open={pickerOpen} 
        onOpenChange={setPickerOpen} 
        onSelect={(urls) => set("coverImage", urls[0])}
      />
    </div>
  )
}
