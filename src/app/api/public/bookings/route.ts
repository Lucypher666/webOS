/**
 * POST /api/public/bookings?workspace=slug
 * Public endpoint — storefront uses this to create bookings.
 */
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

const bookingSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  service: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  timeSlot: z.string().optional(),
  notes: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("workspace")
  if (!slug) return NextResponse.json({ error: "workspace param required" }, { status: 400, headers: CORS })

  const workspace = await prisma.workspace.findUnique({ where: { slug } })
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404, headers: CORS })

  const body = await req.json().catch(() => null)
  const parsed = bookingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400, headers: CORS })
  }

  const booking = await prisma.booking.create({
    data: {
      workspaceId: workspace.id,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone ?? null,
      service: parsed.data.service ?? null,
      date: new Date(parsed.data.date),
      timeSlot: parsed.data.timeSlot ?? null,
      notes: parsed.data.notes ?? null,
      status: "pending",
    },
  })

  return NextResponse.json({ success: true, bookingId: booking.id }, { status: 201, headers: CORS })
}
