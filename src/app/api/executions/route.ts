import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createExecutionSchema } from "@/lib/validations/execution";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const testCycleId = searchParams.get("testCycleId");
    const testCaseId = searchParams.get("testCaseId");

    const where: Record<string, string> = {};
    if (projectId) where.projectId = projectId;
    if (testCycleId) where.testCycleId = testCycleId;
    if (testCaseId) where.testCaseId = testCaseId;

    const executions = await prisma.execution.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { testCase: true, testCycle: true },
    });

    return NextResponse.json(executions);
  } catch (error) {
    console.error("Error al obtener ejecuciones:", error);
    return NextResponse.json({ error: "Error al obtener las ejecuciones" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createExecutionSchema.parse(body);

    const execution = await prisma.execution.create({
      data: {
        status: validatedData.status,
        evidence: validatedData.evidence ?? null,
        notes: validatedData.notes ?? null,
        executedBy: validatedData.executedBy,
        executedAt: validatedData.executedAt ? new Date(validatedData.executedAt) : null,
        testCaseId: validatedData.testCaseId,
        testCycleId: validatedData.testCycleId ?? null,
        projectId: validatedData.projectId,
      },
    });

    return NextResponse.json(execution, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    console.error("Error al crear ejecución:", error);
    return NextResponse.json({ error: "Error al crear la ejecución" }, { status: 500 });
  }
}