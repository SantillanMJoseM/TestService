import { z } from "zod";

export const createVersionSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(50),
  description: z.string().max(500).optional().nullable(),
  projectId: z.string().uuid("ID de proyecto inválido"),
});

export const updateVersionSchema = createVersionSchema.partial().omit({ projectId: true });

export type CreateVersionInput = z.infer<typeof createVersionSchema>;
export type UpdateVersionInput = z.infer<typeof updateVersionSchema>;