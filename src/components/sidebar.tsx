"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import {
  LayoutDashboard, Package, FileText, BookOpen, Image, Megaphone,
  ShoppingCart, Calendar, Search, Palette, Settings, Building2,
  LogOut, Layers, ChevronRight, Users, Shield, UserPlus, CreditCard,
  Menu, X, Code2,
} from "lucide-react"
import { NotificationBell } from "@/components/notification-bell"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/products", icon: Package },
  { label: "Orders", href: "/orders", icon: ShoppingCart },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Bookings", href: "/bookings", icon: Calendar },
  { label: "Coupons", href: "/coupons", icon: Megaphone },
  { label: "Gift Cards", href: "/gift-cards", icon: Layers },
  { label: "Pages", href: "/pages", icon: FileText },
  { label: "Blog", href: "/blog", icon: BookOpen },
  { label: "Banners", href: "/banners", icon: Megaphone },
  { label: "Media", href: "/media", icon: Image },
  { label: "SEO", href: "/seo", icon: Search },
  { label: "Theme", href: "/theme", icon: Palette },
  { label: "API Access", href: "/api-access", icon: Code2 },
]

const workspaceOwnerItems = [
  { label: "Team", href: "/team", icon: UserPlus },
  { label: "Billing", href: "/billing", icon: CreditCard },
  { label: "Audit Logs", href: "/audit-logs", icon: Shield },
  { label: "Settings", href: "/settings", icon: Settings },
]

const adminItems = [
  { label: "Workspaces", href: "/workspaces", icon: Building2 },
  { label: "Users", href: "/users", icon: Users },
  { label: "Audit Logs", href: "/audit-logs", icon: Shield },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN"
  const isOwner = session?.user?.role === "WORKSPACE_OWNER"

  function NavLink({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
    const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href.split("?")[0]))
    return (
      <Link
        href={href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors group",
          active ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
        )}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span className="flex-1">{label}</span>
        {active && <ChevronRight className="w-3 h-3 opacity-60" />}
      </Link>
    )
  }

  const sidebarContent = (
    <aside className="flex flex-col bg-zinc-950 h-full border-r border-zinc-800">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-zinc-800">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 shrink-0">
          <Layers className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white truncate">WebOS Admin</p>
          {session?.user?.workspaceName && (
            <p className="text-xs text-zinc-500 truncate">{session.user.workspaceName}</p>
          )}
          {isSuperAdmin && <p className="text-xs text-blue-400">Super Admin</p>}
        </div>
        {/* Mobile close */}
        <button onClick={() => setMobileOpen(false)} className="md:hidden text-zinc-500 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navItems.map(item => <NavLink key={item.href} {...item} />)}

        {isOwner && !isSuperAdmin && (
          <>
            <div className="pt-4 pb-2 px-3">
              <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">Workspace</p>
            </div>
            {workspaceOwnerItems.map(item => <NavLink key={item.href} {...item} />)}
          </>
        )}

        {isSuperAdmin && (
          <>
            <div className="pt-4 pb-2 px-3">
              <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">Super Admin</p>
            </div>
            {adminItems.map(item => <NavLink key={item.href} {...item} />)}
            <NavLink href="/settings" icon={Settings} label="Settings" />
          </>
        )}

        {!isOwner && !isSuperAdmin && (
          <NavLink href="/settings" icon={Settings} label="Settings" />
        )}
      </nav>

      {/* User */}
      <div className="border-t border-zinc-800 p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-white">
              {session?.user?.name?.[0]?.toUpperCase() ?? session?.user?.email?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{session?.user?.name ?? "User"}</p>
            <p className="text-xs text-zinc-500 truncate">{session?.user?.email}</p>
          </div>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-zinc-500 hover:text-white transition-colors" title="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:w-60 md:flex md:flex-col">
        {sidebarContent}
      </div>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-zinc-950 border-b border-zinc-800 h-14 flex items-center px-4 gap-3">
        <button onClick={() => setMobileOpen(true)} className="text-zinc-400 hover:text-white transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
            <Layers className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-white">WebOS Admin</span>
        </div>
        <div className="[&_button]:text-zinc-400 [&_button:hover]:text-white">
          <NotificationBell />
        </div>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 flex flex-col">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}
