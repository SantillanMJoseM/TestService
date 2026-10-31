import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTestCaseSchema } from "@/lib/validations/test-case";
import { requirePermission, handleAuthError } from "@/lib/get-user";
import { getUserProjects, canAccessProject } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, "test-cases", "view");
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")));
    const search = searchParams.get("search") || "";
    const priority = searchParams.get("priority") || "";
    const type = searchParams.get("type") || "";
    const projectId = searchParams.get("projectId") || "";
    const moduleId = searchParams.get("moduleId") || "";
    const skip = (page - 1) * limit;

    const accessibleProjects = await getUserProjects(user.id);

    const where: Record<string, unknown> = {
      projectId: { in: accessibleProjects },
    };
    if (projectId) {
      if (!accessibleProjects.includes(projectId)) {
        return NextResponse.json({ error: "No tiene acceso a este proyecto" }, { status: 403 });
      }
      where.projectId = projectId;
    }
    if (moduleId) where.moduleId = moduleId;
    if (priority) where.priority = priority;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [testCases, total] = await Promise.all([
      prisma.testCase.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: { module: true, version: true, project: true },
      }),
      prisma.testCase.count({ where }),
    ]);

    return NextResponse.json({
      data: testCases,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleAuthError(error) as NextResponse;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, "test-cases", "create");
    const body = await request.json();
    const validatedData = createTestCaseSchema.parse(body);

    if (!(await canAccessProject(user.id, validatedData.projectId))) {
      return NextResponse.json({ error: "No tiene acceso a este proyecto" }, { status: 403 });
    }

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

    await logAudit({ action: "CREATE", entity: "TestCase", entityId: testCase.id, userId: user.id, details: `Caso de prueba ${testCase.title} creado` });

    return NextResponse.json(testCase, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    return handleAuthError(error) as NextResponse;
  }
}