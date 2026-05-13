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
import { Plus, X, Image as ImageIcon } from "lucide-react"

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [form, setForm] = useState({
    name: "", description: "", price: "", comparePrice: "", stock: "0",
    sku: "", category: "", status: "DRAFT", featured: false, tags: "",
  })

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        price: parseFloat(form.price),
        comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : null,
        stock: parseInt(form.stock),
        tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
        images: JSON.stringify(images),
      }),
    })
    setLoading(false)
    if (res.ok) router.push("/products")
  }

  const removeImage = (url: string) => {
    setImages(images.filter(img => img !== url))
  }

  return (
    <div>
      <PageHeader title="Add Product" description="Create a new product in your catalog" />
      <form onSubmit={handleSubmit} className="max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-zinc-900">Product Details</h2>
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input required value={form.name} onChange={e => set("name", e.target.value)} placeholder="Product name" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={6} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Product description..." />
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-zinc-900">Media</h2>
              <Button type="button" variant="ghost" size="sm" onClick={() => setPickerOpen(true)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1.5">
                <Plus className="w-4 h-4" /> Add Media
              </Button>
            </div>
            
            {images.length === 0 ? (
              <div 
                onClick={() => setPickerOpen(true)}
                className="border-2 border-dashed border-zinc-200 rounded-lg p-12 flex flex-col items-center justify-center text-zinc-400 gap-3 cursor-pointer hover:bg-zinc-50 transition-colors"
              >
                <ImageIcon className="w-8 h-8 opacity-20" />
                <p className="text-sm">Click to add images or drag and drop</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {images.map((url, i) => (
                  <div key={url} className="relative aspect-square rounded-lg border border-zinc-200 overflow-hidden group">
                    <img src={url} alt={`Product ${i}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(url)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {i === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-zinc-900/80 text-[10px] text-white py-1 text-center font-medium">
                        Main Image
                      </div>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="aspect-square rounded-lg border-2 border-dashed border-zinc-200 flex items-center justify-center text-zinc-400 hover:border-zinc-300 hover:bg-zinc-50 transition-colors"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-zinc-900">Pricing & Inventory</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Price *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-zinc-400 text-sm">$</span>
                  <Input required type="number" step="0.01" min="0" value={form.price} onChange={e => set("price", e.target.value)} className="pl-7" placeholder="0.00" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Compare Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-zinc-400 text-sm">$</span>
                  <Input type="number" step="0.01" min="0" value={form.comparePrice} onChange={e => set("comparePrice", e.target.value)} className="pl-7" placeholder="0.00" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Stock Quantity</Label>
                <Input type="number" min="0" value={form.stock} onChange={e => set("stock", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>SKU</Label>
                <Input value={form.sku} onChange={e => set("sku", e.target.value)} placeholder="e.g. SKU-001" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-zinc-900">Organization</h2>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input value={form.category} onChange={e => set("category", e.target.value)} placeholder="e.g. Clothing" />
            </div>
            <div className="space-y-1.5">
              <Label>Tags (comma separated)</Label>
              <Input value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="e.g. new, sale" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer pt-2">
              <input type="checkbox" checked={form.featured} onChange={e => set("featured", e.target.checked)} className="rounded border-zinc-300 text-blue-600 focus:ring-blue-600" />
              <span className="text-sm text-zinc-700 font-medium">Feature on home page</span>
            </label>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button type="submit" size="lg" disabled={loading}>{loading ? "Saving…" : "Save Product"}</Button>
            <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>Cancel</Button>
          </div>
        </div>

        <MediaPicker
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onSelect={(urls) => setImages(prev => Array.from(new Set([...prev, ...urls])))}
          multiple
          selectedUrls={images}
        />
      </form>
    </div>
  )
}
