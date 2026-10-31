import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, handleAuthError } from "@/lib/get-user";
import { logAudit } from "@/lib/audit";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requirePermission(request, "registration-requests", "approve");
    const { id } = await params;

    const regRequest = await prisma.registrationRequest.findUnique({ where: { id } });
    if (!regRequest) return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
    if (regRequest.status !== "Pending") {
      return NextResponse.json({ error: "La solicitud ya fue procesada" }, { status: 409 });
    }

    await prisma.registrationRequest.update({
      where: { id },
      data: {
        status: "Rejected",
        reviewedBy: admin.id,
        reviewedAt: new Date(),
      },
    });

    await logAudit({
      action: "REJECT",
      entity: "RegistrationRequest",
      entityId: id,
      userId: admin.id,
      details: `Solicitud de ${regRequest.username} rechazada`,
    });

    return NextResponse.json({ message: "Solicitud rechazada" });
  } catch (error) {
    return handleAuthError(error) as NextResponse;
  }
}