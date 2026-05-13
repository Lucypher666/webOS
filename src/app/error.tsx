"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-zinc-900 mb-2">Something went wrong</h1>
            <p className="text-sm text-zinc-500 mb-6">{error.message || "An unexpected error occurred. Please try again."}</p>
            <button onClick={reset} className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors">
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
