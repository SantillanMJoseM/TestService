import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateModuleSchema } from "@/lib/validations/module";
import { requirePermission, handleAuthError } from "@/lib/get-user";
import { canAccessProject } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission(_request, "modules", "view");
    const { id } = await params;
    const mod = await prisma.module.findUnique({
      where: { id },
      include: { project: true, testCases: true },
    });
    if (!mod) return NextResponse.json({ error: "Módulo no encontrado" }, { status: 404 });
    if (!(await canAccessProject(user.id, mod.projectId))) {
      return NextResponse.json({ error: "No tiene acceso a este proyecto" }, { status: 403 });
    }
    return NextResponse.json(mod);
  } catch (error) {
    return handleAuthError(error) as NextResponse;
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission(request, "modules", "edit");
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateModuleSchema.parse(body);

    const existing = await prisma.module.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Módulo no encontrado" }, { status: 404 });
    if (!(await canAccessProject(user.id, existing.projectId))) {
      return NextResponse.json({ error: "No tiene acceso a este proyecto" }, { status: 403 });
    }

    const mod = await prisma.module.update({
      where: { id },
      data: {
        ...(validatedData.name !== undefined && { name: validatedData.name }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
      },
    });

    await logAudit({ action: "UPDATE", entity: "Module", entityId: id, userId: user.id, details: `Módulo ${mod.name} actualizado` });

    return NextResponse.json(mod);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    return handleAuthError(error) as NextResponse;
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission(_request, "modules", "delete");
    const { id } = await params;
    const existing = await prisma.module.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Módulo no encontrado" }, { status: 404 });
    if (!(await canAccessProject(user.id, existing.projectId))) {
      return NextResponse.json({ error: "No tiene acceso a este proyecto" }, { status: 403 });
    }
    await prisma.module.delete({ where: { id } });

    await logAudit({ action: "DELETE", entity: "Module", entityId: id, userId: user.id, details: `Módulo eliminado` });

    return NextResponse.json({ message: "Módulo eliminado correctamente" });
  } catch (error) {
    return handleAuthError(error) as NextResponse;
  }
}