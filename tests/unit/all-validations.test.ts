import { createModuleSchema } from "@/lib/validations/module";
import { createVersionSchema } from "@/lib/validations/version";
import { createTestCaseSchema } from "@/lib/validations/test-case";
import { createTestCycleSchema } from "@/lib/validations/test-cycle";
import { createExecutionSchema } from "@/lib/validations/execution";
import { createDefectSchema } from "@/lib/validations/defect";
import { createUatApprovalSchema } from "@/lib/validations/uat-approval";

const UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("createModuleSchema", () => {
  it("valida módulo válido", () => {
    expect(createModuleSchema.safeParse({ name: "Módulo 1", projectId: UUID }).success).toBe(true);
  });
  it("rechaza nombre vacío", () => {
    expect(createModuleSchema.safeParse({ name: "", projectId: UUID }).success).toBe(false);
  });
  it("rechaza projectId inválido", () => {
    expect(createModuleSchema.safeParse({ name: "Módulo", projectId: "invalid" }).success).toBe(false);
  });
});

describe("createVersionSchema", () => {
  it("valida versión válida", () => {
    expect(createVersionSchema.safeParse({ name: "1.0.0", projectId: UUID }).success).toBe(true);
  });
  it("rechaza nombre vacío", () => {
    expect(createVersionSchema.safeParse({ name: "", projectId: UUID }).success).toBe(false);
  });
});

describe("createTestCaseSchema", () => {
  it("valida caso de prueba válido", () => {
    expect(createTestCaseSchema.safeParse({
      title: "Caso 1", steps: "Paso 1", expectedResult: "OK", projectId: UUID,
    }).success).toBe(true);
  });
  it("rechaza título vacío", () => {
    expect(createTestCaseSchema.safeParse({
      title: "", steps: "Paso 1", expectedResult: "OK", projectId: UUID,
    }).success).toBe(false);
  });
  it("rechaza pasos vacíos", () => {
    expect(createTestCaseSchema.safeParse({
      title: "Caso 1", steps: "", expectedResult: "OK", projectId: UUID,
    }).success).toBe(false);
  });
  it("valida prioridad y tipo", () => {
    const r = createTestCaseSchema.safeParse({
      title: "Caso", steps: "Paso", expectedResult: "OK", projectId: UUID, priority: "High", type: "UAT",
    });
    expect(r.success).toBe(true);
  });
});

describe("createTestCycleSchema", () => {
  it("valida ciclo válido", () => {
    expect(createTestCycleSchema.safeParse({ name: "Ciclo 1", projectId: UUID, versionId: UUID }).success).toBe(true);
  });
  it("rechaza sin versión", () => {
    expect(createTestCycleSchema.safeParse({ name: "Ciclo", projectId: UUID }).success).toBe(false);
  });
});

describe("createExecutionSchema", () => {
  it("valida ejecución válida", () => {
    expect(createExecutionSchema.safeParse({ executedBy: "tester", testCaseId: UUID, projectId: UUID }).success).toBe(true);
  });
  it("rechaza sin ejecutor", () => {
    expect(createExecutionSchema.safeParse({ executedBy: "", testCaseId: UUID, projectId: UUID }).success).toBe(false);
  });
});

describe("createDefectSchema", () => {
  it("valida incidencia válida", () => {
    expect(createDefectSchema.safeParse({ title: "Bug", description: "Desc", projectId: UUID, reportedBy: "user" }).success).toBe(true);
  });
  it("rechaza título vacío", () => {
    expect(createDefectSchema.safeParse({ title: "", description: "Desc", projectId: UUID, reportedBy: "user" }).success).toBe(false);
  });
});

describe("createUatApprovalSchema", () => {
  it("valida aprobación válida", () => {
    expect(createUatApprovalSchema.safeParse({ projectId: UUID, versionId: UUID, approvedBy: UUID, approvedAt: "2026-01-01T00:00:00Z" }).success).toBe(true);
  });
  it("rechaza sin usuario", () => {
    expect(createUatApprovalSchema.safeParse({ projectId: UUID, versionId: UUID, approvedAt: "2026-01-01T00:00:00Z" }).success).toBe(false);
  });
});