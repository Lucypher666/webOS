import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/page-header"
import Link from "next/link"
import { Plus, Pencil, FileText } from "lucide-react"
import { formatDate } from "@/lib/utils"

const statusColors: Record<string, string> = {
  PUBLISHED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  DRAFT:     "bg-zinc-100 text-zinc-600 border border-zinc-200",
  ARCHIVED:  "bg-orange-50 text-orange-700 border border-orange-200",
}

export default async function PagesPage() {
  const session = await getServerSession(authOptions)
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN"

  const pages = await prisma.page.findMany({
    where: isSuperAdmin ? {} : { workspaceId: session?.user?.workspaceId ?? "__none__" },
    include: { workspace: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pages"
        description="Manage your website pages and content"
        icon={FileText}
        action={
          !isSuperAdmin && (
            <Link href="/pages/new" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              <Plus className="w-4 h-4" /> New Page
            </Link>
          )
        }
      />

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[580px]">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Page</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Slug</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Status</th>
              {isSuperAdmin && <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Workspace</th>}
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Updated</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {pages.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16">
                  <FileText className="w-8 h-8 text-zinc-200 mx-auto mb-3" />
                  <p className="text-sm text-zinc-400 mb-2">No pages yet</p>
                  {!isSuperAdmin && (
                    <Link href="/pages/new" className="text-sm text-blue-600 hover:underline font-medium">Create your first page →</Link>
                  )}
                </td>
              </tr>
            ) : (
              pages.map(page => (
                <tr key={page.id} className="hover:bg-zinc-50 transition-colors group">
                  <td className="px-5 py-3.5 font-medium text-zinc-900">{page.title}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-zinc-400">/{page.slug}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[page.status] ?? "bg-zinc-100 text-zinc-600"}`}>
                      {page.status.charAt(0) + page.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  {isSuperAdmin && <td className="px-5 py-3.5 text-zinc-500 text-xs">{page.workspace.name}</td>}
                  <td className="px-5 py-3.5 text-zinc-400 text-xs">{formatDate(page.updatedAt)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/pages/${page.id}`} className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100">
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        </div>
        {pages.length > 0 && (
          <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50 text-xs text-zinc-400">
            {pages.length} page{pages.length !== 1 ? "s" : ""} total
          </div>
        )}
      </div>
    </div>
  )
}
