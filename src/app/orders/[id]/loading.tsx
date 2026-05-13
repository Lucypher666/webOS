export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-zinc-200 rounded-lg" />
        <div className="space-y-2">
          <div className="h-5 w-36 bg-zinc-200 rounded" />
          <div className="h-3 w-48 bg-zinc-100 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-zinc-200 rounded-xl h-64" />
          <div className="bg-white border border-zinc-200 rounded-xl h-32" />
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl h-80" />
      </div>
    </div>
  )
}
