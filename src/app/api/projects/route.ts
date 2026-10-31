import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createProjectSchema } from "@/lib/validations/project";
import { requirePermission, handleAuthError } from "@/lib/get-user";
import { getUserProjects } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, "projects", "view");
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")));
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    const accessibleProjects = await getUserProjects(user.id);

    const where: Record<string, unknown> = {
      id: { in: accessibleProjects },
    };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { key: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

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
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleAuthError(error) as NextResponse;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, "projects", "create");
    const body = await request.json();
    const validatedData = createProjectSchema.parse(body);

    const existingProject = await prisma.project.findUnique({
      where: { key: validatedData.key },
    });

    if (existingProject) {
      return NextResponse.json({ error: "Ya existe un proyecto con esa clave" }, { status: 409 });
    }

    const project = await prisma.project.create({
      data: {
        name: validatedData.name,
        description: validatedData.description ?? null,
        key: validatedData.key,
      },
    });

    if (user.role !== "Admin") {
      await prisma.userProject.create({
        data: { userId: user.id, projectId: project.id },
      });
    }

    await logAudit({
      action: "CREATE",
      entity: "Project",
      entityId: project.id,
      userId: user.id,
      details: `Proyecto ${project.name} creado`,
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    return handleAuthError(error) as NextResponse;
  }
}