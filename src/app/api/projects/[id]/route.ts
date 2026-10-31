import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateProjectSchema } from "@/lib/validations/project";
import { requirePermission, handleAuthError } from "@/lib/get-user";
import { canAccessProject } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission(request, "projects", "view");
    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        modules: true,
        versions: true,
        _count: { select: { testCases: true, executions: true, defects: true } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    }

    if (!(await canAccessProject(user.id, id))) {
      return NextResponse.json({ error: "No tiene acceso a este proyecto" }, { status: 403 });
    }

    return NextResponse.json(project);
  } catch (error) {
    return handleAuthError(error) as NextResponse;
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission(request, "projects", "edit");
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateProjectSchema.parse(body);

    const existingProject = await prisma.project.findUnique({ where: { id } });
    if (!existingProject) {
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    }

    if (!(await canAccessProject(user.id, id))) {
      return NextResponse.json({ error: "No tiene acceso a este proyecto" }, { status: 403 });
    }

    if (validatedData.key && validatedData.key !== existingProject.key) {
      const keyExists = await prisma.project.findUnique({
        where: { key: validatedData.key },
      });
      if (keyExists) {
        return NextResponse.json({ error: "Ya existe un proyecto con esa clave" }, { status: 409 });
      }
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(validatedData.name !== undefined && { name: validatedData.name }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.key !== undefined && { key: validatedData.key }),
      },
    });

    await logAudit({ action: "UPDATE", entity: "Project", entityId: id, userId: user.id, details: `Proyecto ${project.name} actualizado` });

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    return handleAuthError(error) as NextResponse;
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission(request, "projects", "delete");
    const { id } = await params;

    const existingProject = await prisma.project.findUnique({ where: { id } });
    if (!existingProject) {
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    }

    if (!(await canAccessProject(user.id, id))) {
      return NextResponse.json({ error: "No tiene acceso a este proyecto" }, { status: 403 });
    }

    await prisma.project.delete({ where: { id } });

    await logAudit({ action: "DELETE", entity: "Project", entityId: id, userId: user.id, details: `Proyecto ${existingProject.name} eliminado` });

    return NextResponse.json({ message: "Proyecto eliminado correctamente" });
  } catch (error) {
    return handleAuthError(error) as NextResponse;
  }
}