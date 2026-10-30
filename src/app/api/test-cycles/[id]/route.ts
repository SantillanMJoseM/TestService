import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateTestCycleSchema } from "@/lib/validations/test-cycle";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const cycle = await prisma.testCycle.findUnique({
      where: { id },
      include: { project: true, version: true, executions: { include: { testCase: true } } },
    });
    if (!cycle) return NextResponse.json({ error: "Ciclo de prueba no encontrado" }, { status: 404 });
    return NextResponse.json(cycle);
  } catch (error) {
    console.error("Error al obtener ciclo de prueba:", error);
    return NextResponse.json({ error: "Error al obtener el ciclo de prueba" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateTestCycleSchema.parse(body);

    const existing = await prisma.testCycle.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Ciclo de prueba no encontrado" }, { status: 404 });

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
    return NextResponse.json(cycle);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    console.error("Error al actualizar ciclo de prueba:", error);
    return NextResponse.json({ error: "Error al actualizar el ciclo de prueba" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const existing = await prisma.testCycle.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Ciclo de prueba no encontrado" }, { status: 404 });
    await prisma.testCycle.delete({ where: { id } });
    return NextResponse.json({ message: "Ciclo de prueba eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar ciclo de prueba:", error);
    return NextResponse.json({ error: "Error al eliminar el ciclo de prueba" }, { status: 500 });
  }
}