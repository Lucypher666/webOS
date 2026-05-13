"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Pencil, PackagePlus, Loader2, Package, Search, Filter, Download } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { BulkAddDialog } from "@/components/bulk-add-dialog"

interface Product {
  id: string
  name: string
  slug: string
  category: string | null
  price: number
  comparePrice: number | null
  stock: number
  status: string
  featured: boolean
  images: string[]
  createdAt: string
  workspace?: { name: string }
}

const statusVariant: Record<string, "success" | "secondary" | "outline"> = {
  ACTIVE: "success", DRAFT: "secondary", ARCHIVED: "outline",
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  DRAFT: "bg-zinc-100 text-zinc-600 border border-zinc-200",
  ARCHIVED: "bg-orange-50 text-orange-700 border border-orange-200",
}

export default function ProductsPage() {
  const { data: session } = useSession()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN"

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/products?limit=100")
      const data = await res.json()
      setProducts(data.products ?? data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) fetchProducts()
  }, [session])

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "ALL" || p.status === statusFilter
    return matchSearch && matchStatus
  })

  const stats = {
    total: products.length,
    active: products.filter(p => p.status === "ACTIVE").length,
    draft: products.filter(p => p.status === "DRAFT").length,
    outOfStock: products.filter(p => p.stock === 0).length,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage your product catalog"
        icon={Package}
        action={
          <div className="flex gap-2">
            <a href="/api/export?type=products" download className="inline-flex items-center gap-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              <Download className="w-4 h-4" /> Export
            </a>
            <Button variant="outline" onClick={() => setBulkOpen(true)} className="gap-2">
              <PackagePlus className="w-4 h-4" /> Bulk Add
            </Button>
            <Link href="/products/new" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              <Plus className="w-4 h-4" /> Add Product
            </Link>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Products", value: stats.total, color: "text-zinc-900" },
          { label: "Active", value: stats.active, color: "text-emerald-600" },
          { label: "Drafts", value: stats.draft, color: "text-zinc-500" },
          { label: "Out of Stock", value: stats.outOfStock, color: "text-red-500" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-zinc-200 rounded-xl p-4">
            <p className="text-xs text-zinc-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-400" />
          {["ALL", "ACTIVE", "DRAFT", "ARCHIVED"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === s ? "bg-zinc-900 text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Product</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Price</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Stock</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Status</th>
              {isSuperAdmin && <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Workspace</th>}
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Created</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-16">
                  <Loader2 className="w-5 h-5 animate-spin text-zinc-300 mx-auto mb-2" />
                  <p className="text-sm text-zinc-400">Loading products...</p>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16">
                  <Package className="w-8 h-8 text-zinc-200 mx-auto mb-3" />
                  <p className="text-sm text-zinc-400 mb-2">{search || statusFilter !== "ALL" ? "No products match your filters" : "No products yet"}</p>
                  {!isSuperAdmin && !search && statusFilter === "ALL" && (
                    <Link href="/products/new" className="text-sm text-blue-600 hover:underline font-medium">Add your first product →</Link>
                  )}
                </td>
              </tr>
            ) : (
              filtered.map(product => (
                <tr key={product.id} className="hover:bg-zinc-50 transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-100 overflow-hidden shrink-0">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-4 h-4 text-zinc-300" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900">{product.name}</p>
                        <p className="text-xs text-zinc-400">{product.category ?? "No category"} {product.featured && "· ⭐ Featured"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-semibold text-zinc-900">{formatCurrency(product.price)}</span>
                    {product.comparePrice && (
                      <span className="text-xs text-zinc-400 line-through ml-1.5">{formatCurrency(product.comparePrice)}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`font-medium ${product.stock === 0 ? "text-red-500" : product.stock < 10 ? "text-orange-500" : "text-zinc-700"}`}>
                      {product.stock === 0 ? "Out of stock" : product.stock < 10 ? `Low (${product.stock})` : product.stock}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[product.status] ?? "bg-zinc-100 text-zinc-600"}`}>
                      {product.status}
                    </span>
                  </td>
                  {isSuperAdmin && (
                    <td className="px-5 py-3.5 text-zinc-500 text-xs">{product.workspace?.name}</td>
                  )}
                  <td className="px-5 py-3.5 text-zinc-400 text-xs">{formatDate(product.createdAt)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/products/${product.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        </div>
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50 text-xs text-zinc-400">
            Showing {filtered.length} of {products.length} products
          </div>
        )}
      </div>

      <BulkAddDialog open={bulkOpen} onOpenChange={setBulkOpen} onSuccess={fetchProducts} />
    </div>
  )
}
