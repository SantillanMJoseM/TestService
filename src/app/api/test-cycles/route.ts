import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTestCycleSchema } from "@/lib/validations/test-cycle";
import { requirePermission, handleAuthError } from "@/lib/get-user";
import { getUserProjects, canAccessProject } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, "test-cycles", "view");
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const versionId = searchParams.get("versionId");

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
    if (versionId) where.versionId = versionId;

    const cycles = await prisma.testCycle.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { project: true, version: true, _count: { select: { executions: true } } },
    });

    return NextResponse.json(cycles);
  } catch (error) {
    return handleAuthError(error) as NextResponse;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, "test-cycles", "create");
    const body = await request.json();
    const validatedData = createTestCycleSchema.parse(body);

    if (!(await canAccessProject(user.id, validatedData.projectId))) {
      return NextResponse.json({ error: "No tiene acceso a este proyecto" }, { status: 403 });
    }

    const cycle = await prisma.testCycle.create({
      data: {
        name: validatedData.name,
        description: validatedData.description ?? null,
        projectId: validatedData.projectId,
        versionId: validatedData.versionId,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
      },
    });

    await logAudit({ action: "CREATE", entity: "TestCycle", entityId: cycle.id, userId: user.id, details: `Ciclo ${cycle.name} creado` });

    return NextResponse.json(cycle, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    return handleAuthError(error) as NextResponse;
  }
}