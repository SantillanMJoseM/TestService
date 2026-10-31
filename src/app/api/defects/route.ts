import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createDefectSchema } from "@/lib/validations/defect";
import { requirePermission, handleAuthError } from "@/lib/get-user";
import { getUserProjects, canAccessProject } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, "defects", "view");
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");

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
    if (status) where.status = status;

    const defects = await prisma.defect.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { project: true, execution: { include: { testCase: true } } },
    });

    return NextResponse.json(defects);
  } catch (error) {
    return handleAuthError(error) as NextResponse;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, "defects", "create");
    const body = await request.json();
    const validatedData = createDefectSchema.parse(body);

    if (!(await canAccessProject(user.id, validatedData.projectId))) {
      return NextResponse.json({ error: "No tiene acceso a este proyecto" }, { status: 403 });
    }

    const defect = await prisma.defect.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        severity: validatedData.severity,
        status: validatedData.status,
        projectId: validatedData.projectId,
        executionId: validatedData.executionId ?? null,
        reportedBy: validatedData.reportedBy,
      },
    });

    await logAudit({ action: "CREATE", entity: "Defect", entityId: defect.id, userId: user.id, details: `Incidencia ${defect.title} creada` });

    return NextResponse.json(defect, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    return handleAuthError(error) as NextResponse;
  }
}