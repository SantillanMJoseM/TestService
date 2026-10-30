import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateModuleSchema } from "@/lib/validations/module";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const mod = await prisma.module.findUnique({
      where: { id },
      include: { project: true, testCases: true },
    });
    if (!module) return NextResponse.json({ error: "Módulo no encontrado" }, { status: 404 });
    return NextResponse.json(mod);
  } catch (error) {
    console.error("Error al obtener módulo:", error);
    return NextResponse.json({ error: "Error al obtener el módulo" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateModuleSchema.parse(body);

    const existing = await prisma.module.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Módulo no encontrado" }, { status: 404 });

    const mod = await prisma.module.update({
      where: { id },
      data: {
        ...(validatedData.name !== undefined && { name: validatedData.name }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
      },
    });
    return NextResponse.json(mod);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    console.error("Error al actualizar módulo:", error);
    return NextResponse.json({ error: "Error al actualizar el módulo" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const existing = await prisma.module.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Módulo no encontrado" }, { status: 404 });
    await prisma.module.delete({ where: { id } });
    return NextResponse.json({ message: "Módulo eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar módulo:", error);
    return NextResponse.json({ error: "Error al eliminar el módulo" }, { status: 500 });
  }
}