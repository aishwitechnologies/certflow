import { prisma } from "./db";

export interface LogAuditParams {
  organizationId: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, any>;
  ipAddress?: string;
}

export async function logAudit(params: LogAuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: params.organizationId,
        userId: params.userId || null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null,
        details: params.details ? JSON.stringify(params.details) : null,
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
    // Never let audit failure block the primary transaction
  }
}
