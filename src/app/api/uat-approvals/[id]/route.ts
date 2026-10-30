import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateUatApprovalSchema } from "@/lib/validations/uat-approval";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const approval = await prisma.uatApproval.findUnique({
      where: { id },
      include: { project: true, version: true, user: true },
    });
    if (!approval) return NextResponse.json({ error: "Aprobación UAT no encontrada" }, { status: 404 });
    return NextResponse.json(approval);
  } catch (error) {
    console.error("Error al obtener aprobación UAT:", error);
    return NextResponse.json({ error: "Error al obtener la aprobación UAT" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateUatApprovalSchema.parse(body);

    const existing = await prisma.uatApproval.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Aprobación UAT no encontrada" }, { status: 404 });

    const approval = await prisma.uatApproval.update({
      where: { id },
      data: {
        ...(validatedData.comments !== undefined && { comments: validatedData.comments }),
        ...(validatedData.status !== undefined && { status: validatedData.status }),
        ...(validatedData.approvedAt !== undefined && { approvedAt: new Date(validatedData.approvedAt) }),
      },
    });
    return NextResponse.json(approval);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    console.error("Error al actualizar aprobación UAT:", error);
    return NextResponse.json({ error: "Error al actualizar la aprobación UAT" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const existing = await prisma.uatApproval.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Aprobación UAT no encontrada" }, { status: 404 });
    await prisma.uatApproval.delete({ where: { id } });
    return NextResponse.json({ message: "Aprobación UAT eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar aprobación UAT:", error);
    return NextResponse.json({ error: "Error al eliminar la aprobación UAT" }, { status: 500 });
  }
}