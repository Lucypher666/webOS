import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/page-header"
import { formatDate } from "@/lib/utils"
import { Shield } from "lucide-react"

const actionColors: Record<string, string> = {
  CREATE: "bg-emerald-100 text-emerald-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
  LOGIN: "bg-purple-100 text-purple-700",
  REGISTER: "bg-orange-100 text-orange-700",
  PASSWORD_RESET: "bg-yellow-100 text-yellow-700",
}

export default async function AuditLogsPage() {
  const session = await getServerSession(authOptions)
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN"

  const where = isSuperAdmin
    ? {}
    : { workspaceId: session?.user?.workspaceId ?? "__none__" }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { name: true, email: true } } },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Track all actions performed in your workspace"
        icon={Shield}
      />

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-16 text-center">
            <Shield className="w-8 h-8 text-zinc-200 mx-auto mb-3" />
            <p className="text-sm text-zinc-400">No activity recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Time</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">User</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Action</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Entity</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {logs.map(log => {
                  let meta: any = {}
                  try { meta = JSON.parse(log.metadata ?? "{}") } catch {}
                  return (
                    <tr key={log.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-900">{log.user?.name ?? "System"}</div>
                        <div className="text-xs text-zinc-500">{log.user?.email ?? ""}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${actionColors[log.action] ?? "bg-zinc-100 text-zinc-600"}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-700 capitalize">{log.entity}</td>
                      <td className="px-4 py-3 text-zinc-500 text-xs font-mono max-w-xs truncate">
                        {Object.keys(meta).length > 0 ? JSON.stringify(meta) : log.entityId ?? "—"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
