import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createUatApprovalSchema } from "@/lib/validations/uat-approval";
import { requirePermission, handleAuthError } from "@/lib/get-user";
import { getUserProjects, canAccessProject } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, "uat", "view");
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const versionId = searchParams.get("versionId");

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
    if (versionId) where.versionId = versionId;

    const approvals = await prisma.uatApproval.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { project: true, version: true, user: true },
    });

    return NextResponse.json(approvals);
  } catch (error) {
    return handleAuthError(error) as NextResponse;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, "uat", "create");
    const body = await request.json();
    const validatedData = createUatApprovalSchema.parse(body);

    if (!(await canAccessProject(user.id, validatedData.projectId))) {
      return NextResponse.json({ error: "No tiene acceso a este proyecto" }, { status: 403 });
    }

    const approval = await prisma.uatApproval.create({
      data: {
        projectId: validatedData.projectId,
        versionId: validatedData.versionId,
        approvedBy: validatedData.approvedBy,
        approvedAt: new Date(validatedData.approvedAt),
        comments: validatedData.comments ?? null,
        status: validatedData.status,
      },
    });

    await logAudit({ action: "CREATE", entity: "UatApproval", entityId: approval.id, userId: user.id, details: `Aprobación UAT creada` });

    return NextResponse.json(approval, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    return handleAuthError(error) as NextResponse;
  }
}