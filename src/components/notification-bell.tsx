"use client"

import { useEffect, useRef, useState } from "react"
import { Bell, CheckCheck, Trash2, ShoppingCart, AlertTriangle, Info, CheckCircle, X } from "lucide-react"
import { formatDate } from "@/lib/utils"
import Link from "next/link"

interface Notification {
  id: string
  title: string
  body: string
  type: string
  link: string | null
  read: boolean
  createdAt: string
}

const typeIcon: Record<string, React.ReactNode> = {
  success: <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
  error:   <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />,
  info:    <Info className="w-4 h-4 text-blue-500 shrink-0" />,
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const unread = notifications.filter(n => !n.read).length

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications")
      if (res.ok) setNotifications(await res.json())
    } catch {}
  }

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" })
    setNotifications(n => n.map(x => ({ ...x, read: true })))
  }

  async function clearAll() {
    await fetch("/api/notifications", { method: "DELETE" })
    setNotifications([])
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(o => !o); if (!open && unread > 0) markAllRead() }}
        className="relative w-9 h-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
      >
        <Bell className="w-4.5 h-4.5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <>
                  <button onClick={markAllRead} title="Mark all read" className="text-zinc-400 hover:text-zinc-700 transition-colors">
                    <CheckCheck className="w-4 h-4" />
                  </button>
                  <button onClick={clearAll} title="Clear all" className="text-zinc-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
              <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-700 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-zinc-50">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
                <p className="text-sm text-zinc-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => {
                const content = (
                  <div className={`px-4 py-3 flex items-start gap-3 hover:bg-zinc-50 transition-colors ${!n.read ? "bg-blue-50/40" : ""}`}>
                    <div className="mt-0.5">{typeIcon[n.type] ?? typeIcon.info}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.read ? "font-semibold text-zinc-900" : "font-medium text-zinc-700"}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{n.body}</p>
                      <p className="text-[10px] text-zinc-400 mt-1">{formatDate(n.createdAt)}</p>
                    </div>
                    {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />}
                  </div>
                )
                return n.link ? (
                  <Link key={n.id} href={n.link} onClick={() => setOpen(false)}>{content}</Link>
                ) : (
                  <div key={n.id}>{content}</div>
                )
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-zinc-100 bg-zinc-50">
              <p className="text-xs text-zinc-400 text-center">{notifications.length} notification{notifications.length !== 1 ? "s" : ""}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
