import { z } from "zod";

export const createTestCaseSchema = z.object({
  title: z.string().min(1, "El título es obligatorio").max(200),
  description: z.string().max(1000).optional().nullable(),
  preconditions: z.string().max(1000).optional().nullable(),
  steps: z.string().min(1, "Los pasos son obligatorios"),
  expectedResult: z.string().min(1, "El resultado esperado es obligatorio").max(1000),
  priority: z.enum(["Low", "Medium", "High", "Critical"]).default("Medium"),
  type: z.enum(["Functional", "UAT", "Regression"]).default("Functional"),
  projectId: z.string().uuid("ID de proyecto inválido"),
  moduleId: z.string().uuid("ID de módulo inválido").optional().nullable(),
  versionId: z.string().uuid("ID de versión inválido").optional().nullable(),
});

export const updateTestCaseSchema = createTestCaseSchema.partial().omit({ projectId: true });

export type CreateTestCaseInput = z.infer<typeof createTestCaseSchema>;
export type UpdateTestCaseInput = z.infer<typeof updateTestCaseSchema>;