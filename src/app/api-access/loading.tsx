export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-10 bg-zinc-100 rounded-xl w-64" />
      <div className="grid md:grid-cols-2 gap-4">
        <div className="h-28 bg-zinc-100 rounded-xl" />
        <div className="h-28 bg-zinc-100 rounded-xl" />
      </div>
      <div className="h-56 bg-zinc-100 rounded-xl" />
      <div className="h-64 bg-zinc-100 rounded-xl" />
    </div>
  )
}
