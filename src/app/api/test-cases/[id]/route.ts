import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateTestCaseSchema } from "@/lib/validations/test-case";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const testCase = await prisma.testCase.findUnique({
      where: { id },
      include: { project: true, module: true, version: true, executions: true },
    });
    if (!testCase) return NextResponse.json({ error: "Caso de prueba no encontrado" }, { status: 404 });
    return NextResponse.json(testCase);
  } catch (error) {
    console.error("Error al obtener caso de prueba:", error);
    return NextResponse.json({ error: "Error al obtener el caso de prueba" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateTestCaseSchema.parse(body);

    const existing = await prisma.testCase.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Caso de prueba no encontrado" }, { status: 404 });

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
    return NextResponse.json(testCase);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    console.error("Error al actualizar caso de prueba:", error);
    return NextResponse.json({ error: "Error al actualizar el caso de prueba" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const existing = await prisma.testCase.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Caso de prueba no encontrado" }, { status: 404 });
    await prisma.testCase.delete({ where: { id } });
    return NextResponse.json({ message: "Caso de prueba eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar caso de prueba:", error);
    return NextResponse.json({ error: "Error al eliminar el caso de prueba" }, { status: 500 });
  }
}