import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTestCycleSchema } from "@/lib/validations/test-cycle";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const versionId = searchParams.get("versionId");

    const where: Record<string, string> = {};
    if (projectId) where.projectId = projectId;
    if (versionId) where.versionId = versionId;

    const cycles = await prisma.testCycle.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { project: true, version: true, _count: { select: { executions: true } } },
    });

    return NextResponse.json(cycles);
  } catch (error) {
    console.error("Error al obtener ciclos de prueba:", error);
    return NextResponse.json({ error: "Error al obtener los ciclos de prueba" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createTestCycleSchema.parse(body);

    const cycle = await prisma.testCycle.create({
      data: {
        name: validatedData.name,
        description: validatedData.description ?? null,
        projectId: validatedData.projectId,
        versionId: validatedData.versionId,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
      },
    });

    return NextResponse.json(cycle, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    console.error("Error al crear ciclo de prueba:", error);
    return NextResponse.json({ error: "Error al crear el ciclo de prueba" }, { status: 500 });
  }
}