import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { NavProgress } from "@/components/nav-progress"
import { Suspense } from "react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "WebOS Admin",
  description: "Universal website management platform",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Suspense fallback={null}><NavProgress /></Suspense>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
