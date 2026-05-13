"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <h2 className="text-base font-semibold text-zinc-900 mb-1">Failed to load</h2>
        <p className="text-sm text-zinc-500 mb-5">{error.message || "Something went wrong. Please try again."}</p>
        <button onClick={reset} className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors">
          Retry
        </button>
      </div>
    </div>
  )
}
