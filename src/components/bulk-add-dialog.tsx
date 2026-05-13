"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Plus, Save, Loader2, PackagePlus } from "lucide-react"

interface BulkProduct {
  name: string
  sku: string
  price: string
  stock: string
  status: string
}

export function BulkAddDialog({ open, onOpenChange, onSuccess }: { open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<BulkProduct[]>(
    Array(5).fill(null).map(() => ({ name: "", sku: "", price: "", stock: "0", status: "ACTIVE" }))
  )

  const addRow = () => {
    setProducts([...products, { name: "", sku: "", price: "", stock: "0", status: "ACTIVE" }])
  }

  const removeRow = (index: number) => {
    if (products.length === 1) {
      setProducts([{ name: "", sku: "", price: "", stock: "0", status: "ACTIVE" }])
      return
    }
    setProducts(products.filter((_, i) => i !== index))
  }

  const updateProduct = (index: number, field: keyof BulkProduct, value: string) => {
    const newProducts = [...products]
    newProducts[index] = { ...newProducts[index], [field]: value }
    setProducts(newProducts)
  }

  async function handleSave() {
    const validProducts = products.filter(p => p.name.trim() !== "" && p.price !== "")
    
    if (validProducts.length === 0) {
      alert("Please fill in at least one product with a Name and Price")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products: validProducts.map(p => ({
            ...p,
            price: parseFloat(p.price),
            stock: parseInt(p.stock) || 0,
          }))
        }),
      })

      if (res.ok) {
        onSuccess()
        onOpenChange(false)
        setProducts(Array(5).fill(null).map(() => ({ name: "", sku: "", price: "", stock: "0", status: "ACTIVE" })))
      } else {
        const error = await res.json()
        alert(error.error || "Failed to save products")
      }
    } catch (error) {
      console.error(error)
      alert("An error occurred while saving")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-blue-600" />
            Bulk Add Products
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200 sticky top-0 z-10">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Product Name *</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider w-40">SKU</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider w-32">Price *</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider w-24">Stock</th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {products.map((product, index) => (
                <tr key={index} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-5 py-3">
                    <Input 
                      placeholder="e.g. Classic T-Shirt" 
                      value={product.name} 
                      onChange={e => updateProduct(index, "name", e.target.value)}
                      className="h-9"
                    />
                  </td>
                  <td className="px-5 py-3">
                    <Input 
                      placeholder="SKU" 
                      value={product.sku} 
                      onChange={e => updateProduct(index, "sku", e.target.value)}
                      className="h-9"
                    />
                  </td>
                  <td className="px-5 py-3">
                    <div className="relative">
                      <span className="absolute left-2.5 top-2.5 text-zinc-400 text-xs">$</span>
                      <Input 
                        type="number"
                        placeholder="0.00" 
                        value={product.price} 
                        onChange={e => updateProduct(index, "price", e.target.value)}
                        className="h-9 pl-6"
                      />
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Input 
                      type="number"
                      placeholder="0" 
                      value={product.stock} 
                      onChange={e => updateProduct(index, "stock", e.target.value)}
                      className="h-9"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeRow(index)}
                      disabled={products.length === 1}
                      className="text-zinc-400 hover:text-red-600 h-8 w-8"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4">
            <Button variant="outline" size="sm" onClick={addRow} className="gap-2">
              <Plus className="w-4 h-4" />
              Add another row
            </Button>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-zinc-50">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save {products.length} Products
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
