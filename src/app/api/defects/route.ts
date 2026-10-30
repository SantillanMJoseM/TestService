import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createDefectSchema } from "@/lib/validations/defect";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");

    const where: Record<string, string> = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;

    const defects = await prisma.defect.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { project: true, execution: { include: { testCase: true } } },
    });

    return NextResponse.json(defects);
  } catch (error) {
    console.error("Error al obtener incidencias:", error);
    return NextResponse.json({ error: "Error al obtener las incidencias" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createDefectSchema.parse(body);

    const defect = await prisma.defect.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        severity: validatedData.severity,
        status: validatedData.status,
        projectId: validatedData.projectId,
        executionId: validatedData.executionId ?? null,
        reportedBy: validatedData.reportedBy,
      },
    });

    return NextResponse.json(defect, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    console.error("Error al crear incidencia:", error);
    return NextResponse.json({ error: "Error al crear la incidencia" }, { status: 500 });
  }
}