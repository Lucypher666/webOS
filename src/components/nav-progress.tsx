"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"

export function NavProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const interval = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    // Navigation completed — finish bar
    if (timer.current) clearTimeout(timer.current)
    if (interval.current) clearInterval(interval.current)

    setProgress(100)
    timer.current = setTimeout(() => {
      setVisible(false)
      setProgress(0)
    }, 300)

    return () => {
      if (timer.current) clearTimeout(timer.current)
      if (interval.current) clearInterval(interval.current)
    }
  }, [pathname, searchParams])

  // Start progress when a link is clicked
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest("a")
      if (!target) return
      const href = target.getAttribute("href")
      if (!href || href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto")) return

      if (timer.current) clearTimeout(timer.current)
      if (interval.current) clearInterval(interval.current)

      setProgress(0)
      setVisible(true)

      let current = 0
      interval.current = setInterval(() => {
        current += Math.random() * 15
        if (current > 85) {
          current = 85
          if (interval.current) clearInterval(interval.current)
        }
        setProgress(current)
      }, 150)
    }

    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [])

  if (!visible && progress === 0) return null

  return (
    <div
      className="fixed top-0 left-0 z-[9999] h-0.5 bg-blue-500 transition-all duration-200 ease-out"
      style={{
        width: `${progress}%`,
        opacity: visible ? 1 : 0,
        transition: progress === 100 ? "width 200ms ease-out, opacity 300ms ease 200ms" : "width 150ms ease-out",
      }}
    />
  )
}
