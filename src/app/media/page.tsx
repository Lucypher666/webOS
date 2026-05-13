"use client"

import { useEffect, useRef, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Upload, Trash2, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MediaItem {
  id: string
  name: string
  url: string
  type: string
  size: number
  createdAt: string
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function MediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch("/api/media?limit=100").then(r => r.json()).then(d => { setMedia(d.media ?? d); setLoading(false) })
  }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    const formData = new FormData()
    Array.from(files).forEach(f => formData.append("files", f))
    const res = await fetch("/api/media", { method: "POST", body: formData })
    const uploaded = await res.json()
    setMedia(m => [...uploaded, ...m])
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ""
  }

  async function deleteMedia(id: string) {
    await fetch(`/api/media/${id}`, { method: "DELETE" })
    setMedia(m => m.filter(x => x.id !== id))
  }

  function copyUrl(url: string, id: string) {
    navigator.clipboard.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div>
      <PageHeader
        title="Media Library"
        description="Upload and manage your files and images"
        action={
          <>
            <input ref={inputRef} type="file" multiple className="hidden" onChange={handleUpload} accept="image/*,video/*,.pdf" />
            <Button size="sm" onClick={() => inputRef.current?.click()} disabled={uploading} className="gap-2">
              <Upload className="w-4 h-4" />
              {uploading ? "Uploading…" : "Upload Files"}
            </Button>
          </>
        }
      />

      {loading ? (
        <div className="text-center py-12 text-zinc-400">Loading…</div>
      ) : media.length === 0 ? (
        <div
          className="border-2 border-dashed border-zinc-200 rounded-xl py-20 text-center cursor-pointer hover:border-blue-300 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-400 font-medium">Click to upload files</p>
          <p className="text-zinc-300 text-sm mt-1">Images, videos, PDFs supported</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {media.map(item => (
            <div key={item.id} className="group bg-white border border-zinc-200 rounded-xl overflow-hidden">
              <div className="aspect-square bg-zinc-100 relative">
                {item.type.startsWith("image/") ? (
                  <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs font-medium">
                    {item.type.split("/")[1]?.toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => copyUrl(item.url, item.id)} className="p-1.5 bg-white rounded-lg text-zinc-700 hover:text-zinc-900">
                    {copied === item.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => deleteMedia(item.id)} className="p-1.5 bg-white rounded-lg text-zinc-700 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="px-2.5 py-2">
                <p className="text-xs font-medium text-zinc-700 truncate">{item.name}</p>
                <p className="text-xs text-zinc-400">{formatSize(item.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
