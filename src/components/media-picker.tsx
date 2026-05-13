"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Image as ImageIcon, Upload, Check, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Media {
  id: string
  url: string
  name: string
  type: string
}

interface MediaPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (urls: string[]) => void
  multiple?: boolean
  selectedUrls?: string[]
}

export function MediaPicker({ open, onOpenChange, onSelect, multiple = false, selectedUrls = [] }: MediaPickerProps) {
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selection, setSelection] = useState<string[]>(selectedUrls)

  useEffect(() => {
    if (open) {
      fetchMedia()
      setSelection(selectedUrls)
    }
  }, [open])

  async function fetchMedia() {
    setLoading(true)
    try {
      const res = await fetch("/api/media?limit=100")
      const data = await res.json()
      setMedia(data.media ?? data)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files?.length) return

    setUploading(true)
    const formData = new FormData()
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i])
    }

    try {
      const res = await fetch("/api/media", {
        method: "POST",
        body: formData,
      })
      if (res.ok) {
        await fetchMedia()
      }
    } finally {
      setUploading(false)
    }
  }

  const toggleSelect = (url: string) => {
    if (multiple) {
      setSelection(prev => 
        prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
      )
    } else {
      setSelection([url])
    }
  }

  const handleConfirm = () => {
    onSelect(selection)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" /> Media Library
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="p-4 border-b bg-zinc-50 flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              {selection.length} file(s) selected
            </p>
            <label className="cursor-pointer">
              <input type="file" multiple className="hidden" onChange={handleUpload} disabled={uploading} accept="image/*" />
              <Button size="sm" variant="outline" className="gap-2" asChild>
                <span>
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Upload
                </span>
              </Button>
            </label>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-300" />
              </div>
            ) : media.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-zinc-400 gap-2">
                <ImageIcon className="w-12 h-12 opacity-20" />
                <p>No media files found</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {media.map((item) => {
                  const isSelected = selection.includes(item.url)
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleSelect(item.url)}
                      className={cn(
                        "relative aspect-square rounded-lg border-2 cursor-pointer overflow-hidden group transition-all",
                        isSelected ? "border-blue-600 ring-2 ring-blue-600/20" : "border-transparent hover:border-zinc-300"
                      )}
                    >
                      <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-blue-600 text-white rounded-full p-0.5">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-[10px] text-white font-medium px-2 py-1 bg-black/60 rounded backdrop-blur-sm truncate max-w-[90%]">
                          {item.name}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-zinc-50">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={selection.length === 0}>
            Select {selection.length > 0 && `(${selection.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
