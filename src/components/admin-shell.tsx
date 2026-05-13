import { Sidebar } from "@/components/sidebar"
import { NotificationBell } from "@/components/notification-bell"

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <Sidebar />
      {/* Desktop top bar with notification bell */}
      <div className="hidden md:flex fixed top-0 right-0 left-60 z-30 h-14 bg-zinc-50 border-b border-zinc-200 items-center justify-end px-8">
        <NotificationBell />
      </div>
      <main className="md:pl-60 pt-14 md:pt-14">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
