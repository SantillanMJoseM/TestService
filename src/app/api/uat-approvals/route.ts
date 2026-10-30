import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createUatApprovalSchema } from "@/lib/validations/uat-approval";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const versionId = searchParams.get("versionId");

    const where: Record<string, string> = {};
    if (projectId) where.projectId = projectId;
    if (versionId) where.versionId = versionId;

    const approvals = await prisma.uatApproval.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { project: true, version: true, user: true },
    });

    return NextResponse.json(approvals);
  } catch (error) {
    console.error("Error al obtener aprobaciones UAT:", error);
    return NextResponse.json({ error: "Error al obtener las aprobaciones UAT" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createUatApprovalSchema.parse(body);

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

    return NextResponse.json(approval, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    console.error("Error al crear aprobación UAT:", error);
    return NextResponse.json({ error: "Error al crear la aprobación UAT" }, { status: 500 });
  }
}