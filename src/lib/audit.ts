import { prisma } from "./prisma";

export async function logAudit(params: {
  action: string;
  entity: string;
  entityId?: string;
  userId?: string;
  details?: string;
  ipAddress?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        userId: params.userId,
        details: params.details,
        ipAddress: params.ipAddress,
      },
    });
  } catch (error) {
    console.error("Error al registrar auditoría:", error);
  }
}