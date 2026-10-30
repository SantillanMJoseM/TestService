import { z } from "zod";

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(100, "El nombre no puede superar los 100 caracteres"),
  description: z
    .string()
    .max(500, "La descripción no puede superar los 500 caracteres")
    .optional()
    .nullable(),
  key: z
    .string()
    .min(2, "La clave debe tener al menos 2 caracteres")
    .max(10, "La clave no puede superar los 10 caracteres")
    .regex(
      /^[A-Z0-9-]+$/,
      "La clave solo puede contener letras mayúsculas, números y guiones"
    ),
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;