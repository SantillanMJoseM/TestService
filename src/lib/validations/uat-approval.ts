import { z } from "zod";

export const createUatApprovalSchema = z.object({
  projectId: z.string().uuid("ID de proyecto inválido"),
  versionId: z.string().uuid("ID de versión inválido"),
  approvedBy: z.string().uuid("ID de usuario inválido"),
  approvedAt: z.string().datetime(),
  comments: z.string().max(1000).optional().nullable(),
  status: z.enum(["Pending", "Approved", "Rejected"]).default("Pending"),
});

export const updateUatApprovalSchema = createUatApprovalSchema.partial().omit({ projectId: true, versionId: true, approvedBy: true });

export type CreateUatApprovalInput = z.infer<typeof createUatApprovalSchema>;
export type UpdateUatApprovalInput = z.infer<typeof updateUatApprovalSchema>;