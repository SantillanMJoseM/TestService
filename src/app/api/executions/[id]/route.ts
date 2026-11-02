import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateExecutionSchema } from "@/lib/validations/execution";
import { requirePermission, handleAuthError } from "@/lib/get-user";
import { canAccessProject } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission(request, "executions", "view");
    const { id } = await params;
    const execution = await prisma.execution.findUnique({
      where: { id },
      include: { testCase: true, testCycle: true, project: true, defects: true },
    });
    if (!execution) return NextResponse.json({ error: "Ejecución no encontrada" }, { status: 404 });
    if (!(await canAccessProject(user.id, execution.projectId))) {
      return NextResponse.json({ error: "No tiene acceso a este proyecto" }, { status: 403 });
    }
    return NextResponse.json(execution);
  } catch (error) {
    return handleAuthError(error) as NextResponse;
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission(request, "executions", "edit");
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateExecutionSchema.parse(body);

    const existing = await prisma.execution.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Ejecución no encontrada" }, { status: 404 });
    if (!(await canAccessProject(user.id, existing.projectId))) {
      return NextResponse.json({ error: "No tiene acceso a este proyecto" }, { status: 403 });
    }

    const execution = await prisma.execution.update({
      where: { id },
      data: {
        ...(validatedData.status !== undefined && { status: validatedData.status }),
        ...(validatedData.evidence !== undefined && { evidence: validatedData.evidence }),
        ...(validatedData.notes !== undefined && { notes: validatedData.notes }),
        ...(validatedData.executedBy !== undefined && { executedBy: validatedData.executedBy }),
        ...(validatedData.executedAt !== undefined && { executedAt: validatedData.executedAt ? new Date(validatedData.executedAt) : null }),
        ...(validatedData.testCycleId !== undefined && { testCycleId: validatedData.testCycleId }),
      },
    });

    await logAudit({ action: "UPDATE", entity: "Execution", entityId: id, userId: user.id, details: `Ejecución actualizada por ${user.username}` });

    return NextResponse.json(execution);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    return handleAuthError(error) as NextResponse;
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission(request, "executions", "delete");
    const { id } = await params;
    const existing = await prisma.execution.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Ejecución no encontrada" }, { status: 404 });
    if (!(await canAccessProject(user.id, existing.projectId))) {
      return NextResponse.json({ error: "No tiene acceso a este proyecto" }, { status: 403 });
    }
    await prisma.execution.delete({ where: { id } });

    await logAudit({ action: "DELETE", entity: "Execution", entityId: id, userId: user.id, details: "Ejecución eliminada" });

    return NextResponse.json({ message: "Ejecución eliminada correctamente" });
  } catch (error) {
    return handleAuthError(error) as NextResponse;
  }
}
