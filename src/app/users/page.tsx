"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface User {
  id: string
  name: string | null
  email: string
  role: string
  workspace: { name: string } | null
  createdAt: string
}

const roleVariant: Record<string, "default" | "secondary" | "outline"> = {
  SUPER_ADMIN: "default", WORKSPACE_OWNER: "secondary", EDITOR: "outline", VIEWER: "outline",
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "EDITOR", workspaceId: "" })
  const [workspaces, setWorkspaces] = useState<{ id: string; name: string }[]>([])
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    Promise.all([
      fetch("/api/users").then(r => r.json()),
      fetch("/api/workspaces").then(r => r.json()),
    ]).then(([u, w]) => { setUsers(u); setWorkspaces(w); setLoading(false) })
  }, [])

  async function createUser() {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const user = await res.json()
    setUsers(u => [user, ...u])
    setForm({ name: "", email: "", password: "", role: "EDITOR", workspaceId: "" })
    setAdding(false)
  }

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage platform users and workspace members"
        action={
          <Button size="sm" onClick={() => setAdding(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Add User
          </Button>
        }
      />

      {adding && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 mb-6 space-y-4">
          <h2 className="font-semibold text-zinc-900">New User</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Name</Label><Input value={form.name} onChange={e => set("name", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Email *</Label><Input required type="email" value={form.email} onChange={e => set("email", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Password *</Label><Input required type="password" value={form.password} onChange={e => set("password", e.target.value)} /></div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <select value={form.role} onChange={e => set("role", e.target.value)} className="w-full h-9 px-3 rounded-md border border-input text-sm bg-transparent">
                <option value="EDITOR">Editor</option>
                <option value="VIEWER">Viewer</option>
                <option value="WORKSPACE_OWNER">Workspace Owner</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Workspace</Label>
              <select value={form.workspaceId} onChange={e => set("workspaceId", e.target.value)} className="w-full h-9 px-3 rounded-md border border-input text-sm bg-transparent">
                <option value="">— None (Super Admin) —</option>
                {workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={createUser} disabled={!form.email || !form.password}>Create User</Button>
            <Button variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">User</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Role</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Workspace</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              <tr><td colSpan={4} className="text-center py-12 text-zinc-400">Loading…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-12 text-zinc-400">No users</td></tr>
            ) : users.map(user => (
              <tr key={user.id} className="hover:bg-zinc-50">
                <td className="px-5 py-3.5">
                  <p className="font-medium text-zinc-900">{user.name ?? "—"}</p>
                  <p className="text-xs text-zinc-400">{user.email}</p>
                </td>
                <td className="px-5 py-3.5"><Badge variant={roleVariant[user.role]}>{user.role.replace("_", " ")}</Badge></td>
                <td className="px-5 py-3.5 text-zinc-500">{user.workspace?.name ?? "—"}</td>
                <td className="px-5 py-3.5 text-zinc-400">{formatDate(user.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
