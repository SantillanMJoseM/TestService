import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateVersionSchema } from "@/lib/validations/version";
import { requirePermission, handleAuthError } from "@/lib/get-user";
import { canAccessProject } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission(_request, "versions", "view");
    const { id } = await params;
    const version = await prisma.version.findUnique({
      where: { id },
      include: { project: true, testCycles: true, testCases: true },
    });
    if (!version) return NextResponse.json({ error: "Versión no encontrada" }, { status: 404 });
    if (!(await canAccessProject(user.id, version.projectId))) {
      return NextResponse.json({ error: "No tiene acceso a este proyecto" }, { status: 403 });
    }
    return NextResponse.json(version);
  } catch (error) {
    return handleAuthError(error) as NextResponse;
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission(request, "versions", "edit");
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateVersionSchema.parse(body);

    const existing = await prisma.version.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Versión no encontrada" }, { status: 404 });
    if (!(await canAccessProject(user.id, existing.projectId))) {
      return NextResponse.json({ error: "No tiene acceso a este proyecto" }, { status: 403 });
    }

    const version = await prisma.version.update({
      where: { id },
      data: {
        ...(validatedData.name !== undefined && { name: validatedData.name }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
      },
    });

    await logAudit({ action: "UPDATE", entity: "Version", entityId: id, userId: user.id, details: `Versión ${version.name} actualizada` });

    return NextResponse.json(version);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    return handleAuthError(error) as NextResponse;
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission(_request, "versions", "delete");
    const { id } = await params;
    const existing = await prisma.version.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Versión no encontrada" }, { status: 404 });
    if (!(await canAccessProject(user.id, existing.projectId))) {
      return NextResponse.json({ error: "No tiene acceso a este proyecto" }, { status: 403 });
    }
    await prisma.version.delete({ where: { id } });

    await logAudit({ action: "DELETE", entity: "Version", entityId: id, userId: user.id, details: `Versión eliminada` });

    return NextResponse.json({ message: "Versión eliminada correctamente" });
  } catch (error) {
    return handleAuthError(error) as NextResponse;
  }
}