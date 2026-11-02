import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateTestCaseSchema } from "@/lib/validations/test-case";
import { requirePermission, handleAuthError } from "@/lib/get-user";
import { canAccessProject } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission(request, "test-cases", "view");
    const { id } = await params;
    const testCase = await prisma.testCase.findUnique({
      where: { id },
      include: { project: true, module: true, version: true, executions: true },
    });
    if (!testCase) return NextResponse.json({ error: "Caso de prueba no encontrado" }, { status: 404 });
    if (!(await canAccessProject(user.id, testCase.projectId))) {
      return NextResponse.json({ error: "No tiene acceso a este proyecto" }, { status: 403 });
    }
    return NextResponse.json(testCase);
  } catch (error) {
    return handleAuthError(error) as NextResponse;
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission(request, "test-cases", "edit");
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateTestCaseSchema.parse(body);

    const existing = await prisma.testCase.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Caso de prueba no encontrado" }, { status: 404 });
    if (!(await canAccessProject(user.id, existing.projectId))) {
      return NextResponse.json({ error: "No tiene acceso a este proyecto" }, { status: 403 });
    }

    const testCase = await prisma.testCase.update({
      where: { id },
      data: {
        ...(validatedData.title !== undefined && { title: validatedData.title }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.preconditions !== undefined && { preconditions: validatedData.preconditions }),
        ...(validatedData.steps !== undefined && { steps: validatedData.steps }),
        ...(validatedData.expectedResult !== undefined && { expectedResult: validatedData.expectedResult }),
        ...(validatedData.priority !== undefined && { priority: validatedData.priority }),
        ...(validatedData.type !== undefined && { type: validatedData.type }),
        ...(validatedData.moduleId !== undefined && { moduleId: validatedData.moduleId }),
        ...(validatedData.versionId !== undefined && { versionId: validatedData.versionId }),
      },
    });

    await logAudit({ action: "UPDATE", entity: "TestCase", entityId: id, userId: user.id, details: `Caso de prueba ${testCase.title} actualizado` });

    return NextResponse.json(testCase);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    return handleAuthError(error) as NextResponse;
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission(request, "test-cases", "delete");
    const { id } = await params;
    const existing = await prisma.testCase.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Caso de prueba no encontrado" }, { status: 404 });
    if (!(await canAccessProject(user.id, existing.projectId))) {
      return NextResponse.json({ error: "No tiene acceso a este proyecto" }, { status: 403 });
    }
    await prisma.testCase.delete({ where: { id } });

    await logAudit({ action: "DELETE", entity: "TestCase", entityId: id, userId: user.id, details: "Caso de prueba eliminado" });

    return NextResponse.json({ message: "Caso de prueba eliminado correctamente" });
  } catch (error) {
    return handleAuthError(error) as NextResponse;
  }
}
