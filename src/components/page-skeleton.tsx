export function PageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-zinc-200 rounded-lg" />
          <div className="space-y-2">
            <div className="h-5 w-36 bg-zinc-200 rounded" />
            <div className="h-3 w-52 bg-zinc-100 rounded" />
          </div>
        </div>
        <div className="h-9 w-28 bg-zinc-200 rounded-lg" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-zinc-200 rounded-xl p-4 space-y-2">
            <div className="h-3 w-20 bg-zinc-100 rounded" />
            <div className="h-7 w-12 bg-zinc-200 rounded" />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="bg-zinc-50 border-b border-zinc-200 px-5 py-3 flex gap-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-3 w-16 bg-zinc-200 rounded" />
          ))}
        </div>
        <div className="divide-y divide-zinc-100">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="px-5 py-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-zinc-100 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-40 bg-zinc-200 rounded" />
                <div className="h-3 w-24 bg-zinc-100 rounded" />
              </div>
              <div className="h-3.5 w-16 bg-zinc-100 rounded" />
              <div className="h-5 w-14 bg-zinc-100 rounded-full" />
              <div className="h-3 w-20 bg-zinc-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
