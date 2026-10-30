import { z } from "zod";

export const createModuleSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(100),
  description: z.string().max(500).optional().nullable(),
  projectId: z.string().uuid("ID de proyecto inválido"),
});

export const updateModuleSchema = createModuleSchema.partial().omit({ projectId: true });

export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;