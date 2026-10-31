import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createExecutionSchema } from "@/lib/validations/execution";
import { requirePermission, handleAuthError } from "@/lib/get-user";
import { getUserProjects, canAccessProject } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, "executions", "view");
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const testCycleId = searchParams.get("testCycleId");
    const testCaseId = searchParams.get("testCaseId");

    const accessibleProjects = await getUserProjects(user.id);

    const where: Record<string, unknown> = {
      projectId: { in: accessibleProjects },
    };
    if (projectId) {
      if (!accessibleProjects.includes(projectId)) {
        return NextResponse.json({ error: "No tiene acceso a este proyecto" }, { status: 403 });
      }
      where.projectId = projectId;
    }
    if (testCycleId) where.testCycleId = testCycleId;
    if (testCaseId) where.testCaseId = testCaseId;

    const executions = await prisma.execution.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { testCase: true, testCycle: true },
    });

    return NextResponse.json(executions);
  } catch (error) {
    return handleAuthError(error) as NextResponse;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, "executions", "create");
    const body = await request.json();
    const validatedData = createExecutionSchema.parse(body);

    if (!(await canAccessProject(user.id, validatedData.projectId))) {
      return NextResponse.json({ error: "No tiene acceso a este proyecto" }, { status: 403 });
    }

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

    await logAudit({ action: "CREATE", entity: "Execution", entityId: execution.id, userId: user.id, details: `Ejecución creada por ${user.username}` });

    return NextResponse.json(execution, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    return handleAuthError(error) as NextResponse;
  }
}