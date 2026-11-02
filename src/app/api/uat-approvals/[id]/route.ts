import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateUatApprovalSchema } from "@/lib/validations/uat-approval";
import { requirePermission, handleAuthError } from "@/lib/get-user";
import { canAccessProject } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission(request, "uat", "view");
    const { id } = await params;
    const approval = await prisma.uatApproval.findUnique({
      where: { id },
      include: { project: true, version: true, user: true },
    });
    if (!approval) return NextResponse.json({ error: "Aprobación UAT no encontrada" }, { status: 404 });
    if (!(await canAccessProject(user.id, approval.projectId))) {
      return NextResponse.json({ error: "No tiene acceso a este proyecto" }, { status: 403 });
    }
    return NextResponse.json(approval);
  } catch (error) {
    return handleAuthError(error) as NextResponse;
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission(request, "uat", "edit");
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateUatApprovalSchema.parse(body);

    const existing = await prisma.uatApproval.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Aprobación UAT no encontrada" }, { status: 404 });
    if (!(await canAccessProject(user.id, existing.projectId))) {
      return NextResponse.json({ error: "No tiene acceso a este proyecto" }, { status: 403 });
    }

    const approval = await prisma.uatApproval.update({
      where: { id },
      data: {
        ...(validatedData.comments !== undefined && { comments: validatedData.comments }),
        ...(validatedData.status !== undefined && { status: validatedData.status }),
        ...(validatedData.approvedAt !== undefined && { approvedAt: new Date(validatedData.approvedAt) }),
      },
    });

    await logAudit({ action: "UPDATE", entity: "UatApproval", entityId: id, userId: user.id, details: "Aprobación UAT actualizada" });

    return NextResponse.json(approval);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    return handleAuthError(error) as NextResponse;
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission(request, "uat", "delete");
    const { id } = await params;
    const existing = await prisma.uatApproval.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Aprobación UAT no encontrada" }, { status: 404 });
    if (!(await canAccessProject(user.id, existing.projectId))) {
      return NextResponse.json({ error: "No tiene acceso a este proyecto" }, { status: 403 });
    }
    await prisma.uatApproval.delete({ where: { id } });

    await logAudit({ action: "DELETE", entity: "UatApproval", entityId: id, userId: user.id, details: "Aprobación UAT eliminada" });

    return NextResponse.json({ message: "Aprobación UAT eliminada correctamente" });
  } catch (error) {
    return handleAuthError(error) as NextResponse;
  }
}
