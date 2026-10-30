import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createProjectSchema } from "@/lib/validations/project";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")));
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { key: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          _count: { select: { modules: true, testCases: true, executions: true } },
        },
      }),
      prisma.project.count({ where }),
    ]);

    return NextResponse.json({
      data: projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error al obtener proyectos:", error);
    return NextResponse.json({ error: "Error al obtener los proyectos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createProjectSchema.parse(body);

    const existingProject = await prisma.project.findUnique({
      where: { key: validatedData.key },
    });

    if (existingProject) {
      return NextResponse.json(
        { error: "Ya existe un proyecto con esa clave" },
        { status: 409 }
      );
    }

    const project = await prisma.project.create({
      data: {
        name: validatedData.name,
        description: validatedData.description ?? null,
        key: validatedData.key,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.message },
        { status: 400 }
      );
    }

    console.error("Error al crear proyecto:", error);
    return NextResponse.json(
      { error: "Error al crear el proyecto" },
      { status: 500 }
    );
  }
}