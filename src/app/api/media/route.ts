import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { v2 as cloudinary } from "cloudinary"

const ALLOWED_TYPES = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
  "application/pdf", "video/mp4", "video/webm",
])
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

const cloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const isSuperAdmin = session.user.role === "SUPER_ADMIN"
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50")))

  const where = isSuperAdmin ? {} : { workspaceId: session.user.workspaceId ?? "__none__" }

  const [total, media] = await Promise.all([
    prisma.media.count({ where }),
    prisma.media.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])

  return NextResponse.json({ media, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!session.user.workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 })

  if (!cloudinaryConfigured) {
    return NextResponse.json(
      { error: "Media uploads require Cloudinary. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your environment variables." },
      { status: 503 }
    )
  }

  const formData = await req.formData()
  const files = formData.getAll("files") as File[]

  if (files.length === 0) return NextResponse.json({ error: "No files provided" }, { status: 400 })
  if (files.length > 20) return NextResponse.json({ error: "Maximum 20 files per upload" }, { status: 400 })

  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: `File type "${file.type}" is not allowed.` }, { status: 400 })
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: `File "${file.name}" exceeds the 10 MB size limit.` }, { status: 400 })
    }
    if (file.size === 0) {
      return NextResponse.json({ error: `File "${file.name}" is empty.` }, { status: 400 })
    }
  }

  const created = await Promise.all(
    files.map(async (file) => {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Upload to Cloudinary
      const result = await new Promise<any>((resolve, reject) => {
        const resourceType = file.type.startsWith("video/") ? "video" : file.type === "application/pdf" ? "raw" : "image"
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `webos/${session.user.workspaceId}`,
            resource_type: resourceType,
            public_id: `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`,
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          }
        )
        uploadStream.end(buffer)
      })

      return prisma.media.create({
        data: {
          workspaceId: session.user.workspaceId!,
          name: file.name,
          url: result.secure_url,
          type: file.type,
          size: file.size,
        },
      })
    })
  )

  return NextResponse.json(created, { status: 201 })
}
