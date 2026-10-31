import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createModuleSchema } from "@/lib/validations/module";
import { requirePermission, handleAuthError } from "@/lib/get-user";
import { getUserProjects, canAccessProject } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, "modules", "view");
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

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

    const modules = await prisma.module.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { testCases: true } } },
    });

    return NextResponse.json(modules);
  } catch (error) {
    return handleAuthError(error) as NextResponse;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, "modules", "create");
    const body = await request.json();
    const validatedData = createModuleSchema.parse(body);

    if (!(await canAccessProject(user.id, validatedData.projectId))) {
      return NextResponse.json({ error: "No tiene acceso a este proyecto" }, { status: 403 });
    }

    const mod = await prisma.module.create({
      data: {
        name: validatedData.name,
        description: validatedData.description ?? null,
        projectId: validatedData.projectId,
      },
    });

    await logAudit({ action: "CREATE", entity: "Module", entityId: mod.id, userId: user.id, details: `Módulo ${mod.name} creado` });

    return NextResponse.json(mod, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    return handleAuthError(error) as NextResponse;
  }
}