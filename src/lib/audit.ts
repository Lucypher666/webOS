import { prisma } from "@/lib/prisma"

interface AuditParams {
  workspaceId?: string | null
  userId?: string | null
  action: string
  entity: string
  entityId?: string
  metadata?: Record<string, any>
  ipAddress?: string
}

export async function logAudit(params: AuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        workspaceId: params.workspaceId ?? null,
        userId: params.userId ?? null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId ?? null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        ipAddress: params.ipAddress ?? null,
      },
    })
  } catch (err) {
    // Audit logging is non-fatal
    console.error("[AUDIT LOG]", err)
  }
}
