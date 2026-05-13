"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Plus, X, Image as ImageIcon, Package, CheckCircle, Loader2 } from "lucide-react"
import { MediaPicker } from "@/components/media-picker"

interface Variant {
  id?: string
  name: string
  sku: string
  price: string
  stock: string
  options: string
  isNew?: boolean
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const [pageLoading, setPageLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [variants, setVariants] = useState<Variant[]>([])
  const [form, setForm] = useState({
    name: "", description: "", price: "", comparePrice: "", stock: "0",
    sku: "", category: "", status: "DRAFT", featured: false, tags: "",
  })

  useEffect(() => {
    fetch(`/api/products/${params.id}`)
      .then(r => r.json())
      .then(p => {
        setForm({
          name: p.name ?? "",
          description: p.description ?? "",
          price: String(p.price ?? ""),
          comparePrice: p.comparePrice ? String(p.comparePrice) : "",
          stock: String(p.stock ?? 0),
          sku: p.sku ?? "",
          category: p.category ?? "",
          status: p.status ?? "DRAFT",
          featured: p.featured ?? false,
          tags: Array.isArray(p.tags) ? p.tags.join(", ") : (p.tags ?? ""),
        })
        try {
          setImages(typeof p.images === "string" ? JSON.parse(p.images) : (p.images ?? []))
        } catch { setImages([]) }
        if (p.variants) {
          setVariants(p.variants.map((v: any) => ({
            id: v.id, name: v.name, sku: v.sku ?? "", price: String(v.price ?? ""),
            stock: String(v.stock ?? 0), options: v.options ?? "",
          })))
        }
        setPageLoading(false)
      })
  }, [params.id])

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch(`/api/products/${params.id}`, {
      method: "PATCH",
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

    // Save variants
    for (const v of variants) {
      const body = {
        name: v.name, sku: v.sku || null,
        price: v.price ? parseFloat(v.price) : null,
        stock: parseInt(v.stock) || 0,
        options: v.options || null,
      }
      if (v.id && !v.isNew) {
        await fetch(`/api/products/${params.id}/variants/${v.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        })
      } else if (v.isNew) {
        await fetch(`/api/products/${params.id}/variants`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        })
      }
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function handleDelete() {
    if (!confirm("Delete this product? This cannot be undone.")) return
    setDeleting(true)
    await fetch(`/api/products/${params.id}`, { method: "DELETE" })
    router.push("/products")
  }

  async function deleteVariant(id: string) {
    await fetch(`/api/products/${params.id}/variants/${id}`, { method: "DELETE" })
    setVariants(v => v.filter(x => x.id !== id))
  }

  function addVariant() {
    setVariants(v => [...v, { name: "", sku: "", price: "", stock: "0", options: "", isNew: true }])
  }

  function updateVariant(i: number, k: string, val: string) {
    setVariants(v => v.map((x, idx) => idx === i ? { ...x, [k]: val } : x))
  }

  if (pageLoading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-6 h-6 animate-spin text-zinc-300" />
    </div>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Product"
        description={form.name || "Update product details"}
        icon={Package}
        action={
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting} className="gap-1.5">
            <Trash2 className="w-4 h-4" />{deleting ? "Deleting…" : "Delete Product"}
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Details */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-zinc-900">Product Details</h2>
            <div className="space-y-1.5">
              <Label>Name <span className="text-red-400">*</span></Label>
              <Input required value={form.name} onChange={e => set("name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={6} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Describe the product..." />
            </div>
          </div>

          {/* Media */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-zinc-900">Media</h2>
              <Button type="button" variant="ghost" size="sm" onClick={() => setPickerOpen(true)} className="text-blue-600 hover:bg-blue-50 gap-1.5">
                <Plus className="w-4 h-4" /> Add Media
              </Button>
            </div>
            {images.length === 0 ? (
              <div onClick={() => setPickerOpen(true)} className="border-2 border-dashed border-zinc-200 rounded-lg p-12 flex flex-col items-center justify-center text-zinc-400 gap-3 cursor-pointer hover:bg-zinc-50 transition-colors">
                <ImageIcon className="w-8 h-8 opacity-20" />
                <p className="text-sm">Click to add images</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {images.map((url, i) => (
                  <div key={url} className="relative aspect-square rounded-lg border border-zinc-200 overflow-hidden group">
                    <img src={url} alt={`Product ${i}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setImages(images.filter(x => x !== url))}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                    {i === 0 && <div className="absolute bottom-0 left-0 right-0 bg-zinc-900/80 text-[10px] text-white py-1 text-center">Main</div>}
                  </div>
                ))}
                <button type="button" onClick={() => setPickerOpen(true)}
                  className="aspect-square rounded-lg border-2 border-dashed border-zinc-200 flex items-center justify-center text-zinc-300 hover:border-zinc-300 hover:bg-zinc-50 transition-colors">
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-zinc-900">Pricing & Inventory</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Price <span className="text-red-400">*</span></Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-zinc-400 text-sm">$</span>
                  <Input required type="number" step="0.01" min="0" value={form.price} onChange={e => set("price", e.target.value)} className="pl-7" />
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

          {/* Variants */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-zinc-900">Variants</h2>
                <p className="text-xs text-zinc-400 mt-0.5">e.g. Size: Small, Color: Red</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addVariant} className="gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add Variant
              </Button>
            </div>
            {variants.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-4">No variants. Add one if this product comes in different sizes, colors, etc.</p>
            ) : (
              <div className="space-y-3">
                {variants.map((v, i) => (
                  <div key={i} className="grid grid-cols-5 gap-2 items-center p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                    <Input placeholder="Name *" value={v.name} onChange={e => updateVariant(i, "name", e.target.value)} className="col-span-2 text-sm" />
                    <Input placeholder="SKU" value={v.sku} onChange={e => updateVariant(i, "sku", e.target.value)} className="text-sm" />
                    <Input placeholder="Price" type="number" step="0.01" value={v.price} onChange={e => updateVariant(i, "price", e.target.value)} className="text-sm" />
                    <div className="flex gap-1.5">
                      <Input placeholder="Stock" type="number" value={v.stock} onChange={e => updateVariant(i, "stock", e.target.value)} className="text-sm" />
                      <button type="button" onClick={() => v.id && !v.isNew ? deleteVariant(v.id) : setVariants(vv => vv.filter((_, idx) => idx !== i))}
                        className="text-zinc-400 hover:text-red-500 transition-colors shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
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
              <Label>Tags</Label>
              <Input value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="new, sale, featured" />
              <p className="text-xs text-zinc-400">Comma separated</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input type="checkbox" checked={form.featured} onChange={e => set("featured", e.target.checked)} className="rounded border-zinc-300 text-blue-600 focus:ring-blue-600" />
              <span className="text-sm text-zinc-700 font-medium">Feature on home page</span>
            </label>
          </div>

          <div className="flex flex-col gap-3">
            <Button type="submit" disabled={saving} className="gap-2 w-full">
              {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Save Changes"}
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={() => router.push("/products")}>
              Back to Products
            </Button>
          </div>
        </div>

        <MediaPicker open={pickerOpen} onOpenChange={setPickerOpen}
          onSelect={urls => setImages(prev => Array.from(new Set([...prev, ...urls])))}
          multiple selectedUrls={images} />
      </form>
    </div>
  )
}
