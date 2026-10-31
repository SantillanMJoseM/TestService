import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createVersionSchema } from "@/lib/validations/version";
import { requirePermission, handleAuthError } from "@/lib/get-user";
import { getUserProjects, canAccessProject } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, "versions", "view");
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

    const versions = await prisma.version.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { testCycles: true, testCases: true } } },
    });

    return NextResponse.json(versions);
  } catch (error) {
    return handleAuthError(error) as NextResponse;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, "versions", "create");
    const body = await request.json();
    const validatedData = createVersionSchema.parse(body);

    if (!(await canAccessProject(user.id, validatedData.projectId))) {
      return NextResponse.json({ error: "No tiene acceso a este proyecto" }, { status: 403 });
    }

    const version = await prisma.version.create({
      data: {
        name: validatedData.name,
        description: validatedData.description ?? null,
        projectId: validatedData.projectId,
      },
    });

    await logAudit({ action: "CREATE", entity: "Version", entityId: version.id, userId: user.id, details: `Versión ${version.name} creada` });

    return NextResponse.json(version, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    return handleAuthError(error) as NextResponse;
  }
}