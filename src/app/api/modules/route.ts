import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createModuleSchema } from "@/lib/validations/module";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const where = projectId ? { projectId } : {};

    const modules = await prisma.module.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { testCases: true } } },
    });

    return NextResponse.json(modules);
  } catch (error) {
    console.error("Error al obtener módulos:", error);
    return NextResponse.json({ error: "Error al obtener los módulos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createModuleSchema.parse(body);

    const mod = await prisma.module.create({
      data: {
        name: validatedData.name,
        description: validatedData.description ?? null,
        projectId: validatedData.projectId,
      },
    });

    return NextResponse.json(mod, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    console.error("Error al crear módulo:", error);
    return NextResponse.json({ error: "Error al crear el módulo" }, { status: 500 });
  }
}
