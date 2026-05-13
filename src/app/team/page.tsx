"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { UserPlus, Trash2, Mail, Clock, Check } from "lucide-react"

interface Invitation {
  id: string
  email: string
  role: string
  accepted: boolean
  expiresAt: string
  createdAt: string
  invitedBy: { name: string | null; email: string }
}

interface TeamMember {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: string
}

export default function TeamPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("EDITOR")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    Promise.all([
      fetch("/api/invitations").then(r => r.json()),
      fetch("/api/users/team").then(r => r.json()),
    ]).then(([invites, team]) => {
      setInvitations(Array.isArray(invites) ? invites : [])
      setMembers(Array.isArray(team) ? team : [])
    }).finally(() => setLoading(false))
  }, [])

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setSending(true)
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Failed to send invitation.")
      } else {
        const link = data.acceptUrl ? ` — Share link: ${data.acceptUrl}` : ""
        setSuccess(`Invitation created for ${email}${link}`)
        setEmail("")
        setInvitations(prev => [data, ...prev])
      }
    } finally {
      setSending(false)
    }
  }

  async function revokeInvite(id: string) {
    await fetch(`/api/invitations/${id}`, { method: "DELETE" })
    setInvitations(prev => prev.filter(i => i.id !== id))
  }

  const roleLabel: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    WORKSPACE_OWNER: "Owner",
    EDITOR: "Editor",
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Team" description="Invite team members and manage access to your workspace" icon={UserPlus} />

      {/* Invite form */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6">
        <h2 className="font-semibold text-zinc-900 mb-4">Invite someone</h2>
        <form onSubmit={sendInvite} className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-48 space-y-1.5">
            <label className="text-sm text-zinc-600">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-zinc-600">Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="EDITOR">Editor</option>
              <option value="WORKSPACE_OWNER">Owner</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={sending}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Mail className="w-4 h-4" />
            {sending ? "Sending…" : "Send invite"}
          </button>
        </form>
        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        {success && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-sm text-emerald-700 font-medium mb-1">Invitation created!</p>
            <p className="text-xs text-emerald-600 break-all">{success}</p>
          </div>
        )}
      </div>

      {/* Current members */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100">
          <h2 className="font-semibold text-zinc-900">Team members</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-zinc-400 text-sm">Loading…</div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-sm">No team members yet.</div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {members.map(m => (
              <div key={m.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-700">{(m.name ?? m.email)[0].toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{m.name ?? "—"}</p>
                    <p className="text-xs text-zinc-500">{m.email}</p>
                  </div>
                </div>
                <span className="text-xs font-medium bg-zinc-100 text-zinc-700 px-2 py-1 rounded-full">
                  {roleLabel[m.role] ?? m.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100">
            <h2 className="font-semibold text-zinc-900">Pending invitations</h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {invitations.map(inv => (
              <div key={inv.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-zinc-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{inv.email}</p>
                    <p className="text-xs text-zinc-500 flex items-center gap-1">
                      {inv.accepted ? (
                        <><Check className="w-3 h-3 text-emerald-500" /> Accepted</>
                      ) : (
                        <><Clock className="w-3 h-3" /> Pending · expires {new Date(inv.expiresAt).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium bg-zinc-100 text-zinc-700 px-2 py-1 rounded-full">
                    {roleLabel[inv.role] ?? inv.role}
                  </span>
                  {!inv.accepted && (
                    <button
                      onClick={() => revokeInvite(inv.id)}
                      className="text-zinc-400 hover:text-red-500 transition-colors"
                      title="Revoke invitation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
