import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateProjectSchema } from "@/lib/validations/project";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        modules: true,
        versions: true,
        _count: {
          select: { testCases: true, executions: true, defects: true },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error al obtener proyecto:", error);
    return NextResponse.json(
      { error: "Error al obtener el proyecto" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateProjectSchema.parse(body);

    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    if (validatedData.key && validatedData.key !== existingProject.key) {
      const keyExists = await prisma.project.findUnique({
        where: { key: validatedData.key },
      });

      if (keyExists) {
        return NextResponse.json(
          { error: "Ya existe un proyecto con esa clave" },
          { status: 409 }
        );
      }
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(validatedData.name !== undefined && { name: validatedData.name }),
        ...(validatedData.description !== undefined && {
          description: validatedData.description,
        }),
        ...(validatedData.key !== undefined && { key: validatedData.key }),
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.message },
        { status: 400 }
      );
    }

    console.error("Error al actualizar proyecto:", error);
    return NextResponse.json(
      { error: "Error al actualizar el proyecto" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Proyecto eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar proyecto:", error);
    return NextResponse.json(
      { error: "Error al eliminar el proyecto" },
      { status: 500 }
    );
  }
}