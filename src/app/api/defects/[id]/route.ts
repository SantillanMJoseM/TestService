import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateDefectSchema } from "@/lib/validations/defect";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const defect = await prisma.defect.findUnique({
      where: { id },
      include: { project: true, execution: { include: { testCase: true } } },
    });
    if (!defect) return NextResponse.json({ error: "Incidencia no encontrada" }, { status: 404 });
    return NextResponse.json(defect);
  } catch (error) {
    console.error("Error al obtener incidencia:", error);
    return NextResponse.json({ error: "Error al obtener la incidencia" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateDefectSchema.parse(body);

    const existing = await prisma.defect.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Incidencia no encontrada" }, { status: 404 });

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
    return NextResponse.json(defect);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    console.error("Error al actualizar incidencia:", error);
    return NextResponse.json({ error: "Error al actualizar la incidencia" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const existing = await prisma.defect.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Incidencia no encontrada" }, { status: 404 });
    await prisma.defect.delete({ where: { id } });
    return NextResponse.json({ message: "Incidencia eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar incidencia:", error);
    return NextResponse.json({ error: "Error al eliminar la incidencia" }, { status: 500 });
  }
}