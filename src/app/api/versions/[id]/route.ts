import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateVersionSchema } from "@/lib/validations/version";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const version = await prisma.version.findUnique({
      where: { id },
      include: { project: true, testCycles: true, testCases: true },
    });
    if (!version) return NextResponse.json({ error: "Versión no encontrada" }, { status: 404 });
    return NextResponse.json(version);
  } catch (error) {
    console.error("Error al obtener versión:", error);
    return NextResponse.json({ error: "Error al obtener la versión" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateVersionSchema.parse(body);

    const existing = await prisma.version.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Versión no encontrada" }, { status: 404 });

    const version = await prisma.version.update({
      where: { id },
      data: {
        ...(validatedData.name !== undefined && { name: validatedData.name }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
      },
    });
    return NextResponse.json(version);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    console.error("Error al actualizar versión:", error);
    return NextResponse.json({ error: "Error al actualizar la versión" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const existing = await prisma.version.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Versión no encontrada" }, { status: 404 });
    await prisma.version.delete({ where: { id } });
    return NextResponse.json({ message: "Versión eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar versión:", error);
    return NextResponse.json({ error: "Error al eliminar la versión" }, { status: 500 });
  }
}