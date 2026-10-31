import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, handleAuthError } from "@/lib/get-user";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const approveSchema = z.object({
  roleId: z.string().uuid().optional(),
  projectIds: z.array(z.string().uuid()).optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requirePermission(request, "registration-requests", "approve");
    const { id } = await params;
    const body = await request.json();
    const validatedData = approveSchema.parse(body);

    const regRequest = await prisma.registrationRequest.findUnique({ where: { id } });
    if (!regRequest) return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
    if (regRequest.status !== "Pending") {
      return NextResponse.json({ error: "La solicitud ya fue procesada" }, { status: 409 });
    }

    // Transaction: create user + update request
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: regRequest.username,
          email: regRequest.email,
          passwordHash: regRequest.passwordHash,
          fullName: regRequest.fullName,
          role: "User",
          roleId: validatedData.roleId || null,
          status: "Active",
          isActive: true,
          mustChangePassword: false,
        },
      });

      if (validatedData.projectIds && validatedData.projectIds.length > 0) {
        await tx.userProject.createMany({
          data: validatedData.projectIds.map((pid) => ({ userId: user.id, projectId: pid })),
        });
      }

      await tx.registrationRequest.update({
        where: { id },
        data: {
          status: "Approved",
          reviewedBy: admin.id,
          reviewedAt: new Date(),
          roleAssigned: validatedData.roleId,
        },
      });

      return user;
    });

    await logAudit({
      action: "APPROVE",
      entity: "RegistrationRequest",
      entityId: id,
      userId: admin.id,
      details: `Solicitud de ${regRequest.username} aprobada`,
    });

    return NextResponse.json({ message: "Solicitud aprobada", user: result });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    return handleAuthError(error) as NextResponse;
  }
}