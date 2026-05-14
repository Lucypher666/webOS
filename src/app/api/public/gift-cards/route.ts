/**
 * POST /api/public/gift-cards?workspace=slug
 * Validate a gift card code and return remaining balance.
 */
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function POST(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("workspace")
  if (!slug) return NextResponse.json({ error: "workspace param required" }, { status: 400, headers: CORS })

  const workspace = await prisma.workspace.findUnique({ where: { slug } })
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404, headers: CORS })

  const { code } = await req.json().catch(() => ({}))
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400, headers: CORS })

  const gc = await prisma.giftCard.findFirst({
    where: { workspaceId: workspace.id, code: String(code).toUpperCase(), active: true },
  })

  if (!gc) return NextResponse.json({ valid: false, error: "Invalid gift card code" }, { headers: CORS })
  if (gc.expiryDate && gc.expiryDate < new Date()) return NextResponse.json({ valid: false, error: "Gift card has expired" }, { headers: CORS })
  if (gc.balance <= 0) return NextResponse.json({ valid: false, error: "Gift card has no balance remaining" }, { headers: CORS })

  return NextResponse.json({ valid: true, balance: gc.balance, code: gc.code }, { headers: CORS })
}
