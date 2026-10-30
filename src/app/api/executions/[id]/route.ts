import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateExecutionSchema } from "@/lib/validations/execution";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const execution = await prisma.execution.findUnique({
      where: { id },
      include: { testCase: true, testCycle: true, project: true, defects: true },
    });
    if (!execution) return NextResponse.json({ error: "Ejecución no encontrada" }, { status: 404 });
    return NextResponse.json(execution);
  } catch (error) {
    console.error("Error al obtener ejecución:", error);
    return NextResponse.json({ error: "Error al obtener la ejecución" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateExecutionSchema.parse(body);

    const existing = await prisma.execution.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Ejecución no encontrada" }, { status: 404 });

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
    return NextResponse.json(execution);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    console.error("Error al actualizar ejecución:", error);
    return NextResponse.json({ error: "Error al actualizar la ejecución" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const existing = await prisma.execution.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Ejecución no encontrada" }, { status: 404 });
    await prisma.execution.delete({ where: { id } });
    return NextResponse.json({ message: "Ejecución eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar ejecución:", error);
    return NextResponse.json({ error: "Error al eliminar la ejecución" }, { status: 500 });
  }
}