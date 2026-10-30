import { z } from "zod";

export const createTestCycleSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(100),
  description: z.string().max(500).optional().nullable(),
  projectId: z.string().uuid("ID de proyecto inválido"),
  versionId: z.string().uuid("ID de versión inválido"),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
});

export const updateTestCycleSchema = createTestCycleSchema.partial().omit({ projectId: true });

export type CreateTestCycleInput = z.infer<typeof createTestCycleSchema>;
export type UpdateTestCycleInput = z.infer<typeof updateTestCycleSchema>;