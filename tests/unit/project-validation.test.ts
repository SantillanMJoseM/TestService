import { createProjectSchema, updateProjectSchema } from "@/lib/validations/project";

describe("createProjectSchema", () => {
  it("valida un proyecto válido", () => {
    const result = createProjectSchema.safeParse({
      name: "Proyecto de prueba",
      description: "Descripción del proyecto",
      key: "PROY-01",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza nombre vacío", () => {
    const result = createProjectSchema.safeParse({
      name: "",
      key: "PROY-01",
    });
    expect(result.success).toBe(false);
  });

  it("rechaza clave con caracteres inválidos", () => {
    const result = createProjectSchema.safeParse({
      name: "Proyecto",
      key: "proy 01",
    });
    expect(result.success).toBe(false);
  });

  it("rechaza clave muy corta", () => {
    const result = createProjectSchema.safeParse({
      name: "Proyecto",
      key: "P",
    });
    expect(result.success).toBe(false);
  });

  it("acepta proyecto sin descripción", () => {
    const result = createProjectSchema.safeParse({
      name: "Proyecto",
      key: "PROY",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza descripción muy larga", () => {
    const result = createProjectSchema.safeParse({
      name: "Proyecto",
      key: "PROY",
      description: "a".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe("updateProjectSchema", () => {
  it("permite actualizar solo el nombre", () => {
    const result = updateProjectSchema.safeParse({ name: "Nuevo nombre" });
    expect(result.success).toBe(true);
  });

  it("permite actualizar solo la clave", () => {
    const result = updateProjectSchema.safeParse({ key: "NUEVA" });
    expect(result.success).toBe(true);
  });

  it("permite actualizar todos los campos", () => {
    const result = updateProjectSchema.safeParse({
      name: "Nuevo nombre",
      description: "Nueva descripción",
      key: "NUEVA",
    });
    expect(result.success).toBe(true);
  });

  it("permite objeto vacío (sin cambios)", () => {
    const result = updateProjectSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rechaza clave inválida en actualización", () => {
    const result = updateProjectSchema.safeParse({ key: "ab" });
    expect(result.success).toBe(false);
  });
});