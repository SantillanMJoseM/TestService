import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createVersionSchema } from "@/lib/validations/version";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const where = projectId ? { projectId } : {};

    const versions = await prisma.version.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { testCycles: true, testCases: true } } },
    });

    return NextResponse.json(versions);
  } catch (error) {
    console.error("Error al obtener versiones:", error);
    return NextResponse.json({ error: "Error al obtener las versiones" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createVersionSchema.parse(body);

    const version = await prisma.version.create({
      data: {
        name: validatedData.name,
        description: validatedData.description ?? null,
        projectId: validatedData.projectId,
      },
    });

    return NextResponse.json(version, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    console.error("Error al crear versión:", error);
    return NextResponse.json({ error: "Error al crear la versión" }, { status: 500 });
  }
}