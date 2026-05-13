export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-48 bg-zinc-100 rounded-lg" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-zinc-100 rounded-xl" />
        ))}
      </div>
      <div className="h-96 bg-zinc-100 rounded-xl" />
    </div>
  )
}
