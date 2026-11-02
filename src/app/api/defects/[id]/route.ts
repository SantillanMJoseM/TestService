import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateDefectSchema } from "@/lib/validations/defect";
import { requirePermission, handleAuthError } from "@/lib/get-user";
import { canAccessProject } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission(request, "defects", "view");
    const { id } = await params;
    const defect = await prisma.defect.findUnique({
      where: { id },
      include: { project: true, execution: { include: { testCase: true } } },
    });
    if (!defect) return NextResponse.json({ error: "Incidencia no encontrada" }, { status: 404 });
    if (!(await canAccessProject(user.id, defect.projectId))) {
      return NextResponse.json({ error: "No tiene acceso a este proyecto" }, { status: 403 });
    }
    return NextResponse.json(defect);
  } catch (error) {
    return handleAuthError(error) as NextResponse;
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission(request, "defects", "edit");
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateDefectSchema.parse(body);

    const existing = await prisma.defect.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Incidencia no encontrada" }, { status: 404 });
    if (!(await canAccessProject(user.id, existing.projectId))) {
      return NextResponse.json({ error: "No tiene acceso a este proyecto" }, { status: 403 });
    }

    const defect = await prisma.defect.update({
      where: { id },
      data: {
        ...(validatedData.title !== undefined && { title: validatedData.title }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.severity !== undefined && { severity: validatedData.severity }),
        ...(validatedData.status !== undefined && { status: validatedData.status }),
        ...(validatedData.executionId !== undefined && { executionId: validatedData.executionId }),
        ...(validatedData.reportedBy !== undefined && { reportedBy: validatedData.reportedBy }),
        ...(validatedData.resolvedAt !== undefined && { resolvedAt: validatedData.resolvedAt ? new Date(validatedData.resolvedAt) : null }),
      },
    });

    await logAudit({ action: "UPDATE", entity: "Defect", entityId: id, userId: user.id, details: `Incidencia ${defect.title} actualizada` });

    return NextResponse.json(defect);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    return handleAuthError(error) as NextResponse;
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission(request, "defects", "delete");
    const { id } = await params;
    const existing = await prisma.defect.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Incidencia no encontrada" }, { status: 404 });
    if (!(await canAccessProject(user.id, existing.projectId))) {
      return NextResponse.json({ error: "No tiene acceso a este proyecto" }, { status: 403 });
    }
    await prisma.defect.delete({ where: { id } });

    await logAudit({ action: "DELETE", entity: "Defect", entityId: id, userId: user.id, details: "Incidencia eliminada" });

    return NextResponse.json({ message: "Incidencia eliminada correctamente" });
  } catch (error) {
    return handleAuthError(error) as NextResponse;
  }
}
