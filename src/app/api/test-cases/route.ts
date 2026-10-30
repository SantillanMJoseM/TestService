import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTestCaseSchema } from "@/lib/validations/test-case";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const moduleId = searchParams.get("moduleId");

    const where: Record<string, string> = {};
    if (projectId) where.projectId = projectId;
    if (moduleId) where.moduleId = moduleId;

    const testCases = await prisma.testCase.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { module: true, version: true },
    });

    return NextResponse.json(testCases);
  } catch (error) {
    console.error("Error al obtener casos de prueba:", error);
    return NextResponse.json({ error: "Error al obtener los casos de prueba" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createTestCaseSchema.parse(body);

    const testCase = await prisma.testCase.create({
      data: {
        title: validatedData.title,
        description: validatedData.description ?? null,
        preconditions: validatedData.preconditions ?? null,
        steps: validatedData.steps,
        expectedResult: validatedData.expectedResult,
        priority: validatedData.priority,
        type: validatedData.type,
        projectId: validatedData.projectId,
        moduleId: validatedData.moduleId ?? null,
        versionId: validatedData.versionId ?? null,
      },
    });

    return NextResponse.json(testCase, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    console.error("Error al crear caso de prueba:", error);
    return NextResponse.json({ error: "Error al crear el caso de prueba" }, { status: 500 });
  }
}