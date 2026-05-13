"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Building2, Users, Package } from "lucide-react"

interface Workspace {
  id: string
  name: string
  slug: string
  domain: string | null
  description: string | null
  active: boolean
  _count: { users: number; products: number; orders: number }
  createdAt: string
}

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: "", description: "", domain: "" })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    fetch("/api/workspaces").then(r => r.json()).then(d => { setWorkspaces(d); setLoading(false) })
  }, [])

  async function createWorkspace() {
    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const workspace = await res.json()
    setWorkspaces(w => [workspace, ...w])
    setForm({ name: "", description: "", domain: "" })
    setAdding(false)
  }

  return (
    <div>
      <PageHeader
        title="Workspaces"
        description="Manage all client workspaces on the platform"
        action={
          <Button size="sm" onClick={() => setAdding(true)} className="gap-2">
            <Plus className="w-4 h-4" /> New Workspace
          </Button>
        }
      />

      {adding && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 mb-6 space-y-4">
          <h2 className="font-semibold text-zinc-900">Create Workspace</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Name *</Label><Input required value={form.name} onChange={e => set("name", e.target.value)} placeholder="Client name" /></div>
            <div className="space-y-1.5"><Label>Domain</Label><Input value={form.domain} onChange={e => set("domain", e.target.value)} placeholder="client.com" /></div>
          </div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Brief description of this workspace" /></div>
          <div className="flex gap-3">
            <Button onClick={createWorkspace} disabled={!form.name}>Create Workspace</Button>
            <Button variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-zinc-400">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map(ws => (
            <div key={ws.id} className="bg-white border border-zinc-200 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Building2 className="w-4.5 h-4.5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900">{ws.name}</p>
                    <p className="text-xs font-mono text-zinc-400">{ws.slug}</p>
                  </div>
                </div>
                <Badge variant={ws.active ? "success" : "secondary"}>{ws.active ? "Active" : "Inactive"}</Badge>
              </div>
              {ws.description && <p className="text-sm text-zinc-500 mb-3">{ws.description}</p>}
              {ws.domain && <p className="text-xs text-blue-500 mb-3">{ws.domain}</p>}
              <div className="flex items-center gap-4 pt-3 border-t border-zinc-100 text-xs text-zinc-500">
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {ws._count.users} users</span>
                <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5" /> {ws._count.products} products</span>
              </div>
            </div>
          ))}
          {workspaces.length === 0 && (
            <div className="col-span-3 text-center py-12 text-zinc-400">No workspaces yet. Create your first one.</div>
          )}
        </div>
      )}
    </div>
  )
}
