import { z } from "zod";

export const createDefectSchema = z.object({
  title: z.string().min(1, "El título es obligatorio").max(200),
  description: z.string().min(1, "La descripción es obligatoria").max(2000),
  severity: z.enum(["Low", "Medium", "High", "Critical"]).default("Medium"),
  status: z.enum(["Open", "InProgress", "Resolved", "Closed", "Reopened"]).default("Open"),
  projectId: z.string().uuid("ID de proyecto inválido"),
  executionId: z.string().uuid("ID de ejecución inválido").optional().nullable(),
  reportedBy: z.string().min(1, "El reportador es obligatorio"),
});

export const updateDefectSchema = createDefectSchema.partial().omit({ projectId: true }).extend({
  resolvedAt: z.string().datetime().optional().nullable(),
});

export type CreateDefectInput = z.infer<typeof createDefectSchema>;
export type UpdateDefectInput = z.infer<typeof updateDefectSchema>;