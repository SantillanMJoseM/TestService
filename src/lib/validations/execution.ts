import { z } from "zod";

export const createExecutionSchema = z.object({
  status: z.enum(["Pending", "Passed", "Failed", "Blocked", "NotRun"]).default("Pending"),
  evidence: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  executedBy: z.string().min(1, "El ejecutor es obligatorio"),
  executedAt: z.string().datetime().optional().nullable(),
  testCaseId: z.string().uuid("ID de caso de prueba inválido"),
  testCycleId: z.string().uuid("ID de ciclo inválido").optional().nullable(),
  projectId: z.string().uuid("ID de proyecto inválido"),
});

export const updateExecutionSchema = createExecutionSchema.partial().omit({ projectId: true, testCaseId: true });

export type CreateExecutionInput = z.infer<typeof createExecutionSchema>;
export type UpdateExecutionInput = z.infer<typeof updateExecutionSchema>;