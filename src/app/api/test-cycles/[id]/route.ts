import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateTestCycleSchema } from "@/lib/validations/test-cycle";
import { requirePermission, handleAuthError } from "@/lib/get-user";
import { canAccessProject } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission(request, "test-cycles", "view");
    const { id } = await params;
    const cycle = await prisma.testCycle.findUnique({
      where: { id },
      include: { project: true, version: true, executions: { include: { testCase: true } } },
    });
    if (!cycle) return NextResponse.json({ error: "Ciclo de prueba no encontrado" }, { status: 404 });
    if (!(await canAccessProject(user.id, cycle.projectId))) {
      return NextResponse.json({ error: "No tiene acceso a este proyecto" }, { status: 403 });
    }
    return NextResponse.json(cycle);
  } catch (error) {
    return handleAuthError(error) as NextResponse;
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission(request, "test-cycles", "edit");
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateTestCycleSchema.parse(body);

    const existing = await prisma.testCycle.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Ciclo de prueba no encontrado" }, { status: 404 });
    if (!(await canAccessProject(user.id, existing.projectId))) {
      return NextResponse.json({ error: "No tiene acceso a este proyecto" }, { status: 403 });
    }

    const cycle = await prisma.testCycle.update({
      where: { id },
      data: {
        ...(validatedData.name !== undefined && { name: validatedData.name }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.versionId !== undefined && { versionId: validatedData.versionId }),
        ...(validatedData.startDate !== undefined && { startDate: validatedData.startDate ? new Date(validatedData.startDate) : null }),
        ...(validatedData.endDate !== undefined && { endDate: validatedData.endDate ? new Date(validatedData.endDate) : null }),
      },
    });

    await logAudit({ action: "UPDATE", entity: "TestCycle", entityId: id, userId: user.id, details: `Ciclo ${cycle.name} actualizado` });

    return NextResponse.json(cycle);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    return handleAuthError(error) as NextResponse;
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission(request, "test-cycles", "delete");
    const { id } = await params;
    const existing = await prisma.testCycle.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Ciclo de prueba no encontrado" }, { status: 404 });
    if (!(await canAccessProject(user.id, existing.projectId))) {
      return NextResponse.json({ error: "No tiene acceso a este proyecto" }, { status: 403 });
    }
    await prisma.testCycle.delete({ where: { id } });

    await logAudit({ action: "DELETE", entity: "TestCycle", entityId: id, userId: user.id, details: "Ciclo de prueba eliminado" });

    return NextResponse.json({ message: "Ciclo de prueba eliminado correctamente" });
  } catch (error) {
    return handleAuthError(error) as NextResponse;
  }
}
