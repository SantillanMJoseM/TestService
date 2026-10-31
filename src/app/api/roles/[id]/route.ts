import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, handleAuthError } from "@/lib/get-user";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const updateRoleSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(200).optional().nullable(),
  isActive: z.boolean().optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission(request, "roles", "view");
    const { id } = await params;
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
    });
    if (!role) return NextResponse.json({ error: "Rol no encontrado" }, { status: 404 });
    return NextResponse.json(role);
  } catch (error) {
    return handleAuthError(error) as NextResponse;
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requirePermission(request, "roles", "edit");
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateRoleSchema.parse(body);

    const existing = await prisma.role.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Rol no encontrado" }, { status: 404 });

    // Protect admin role
    if (existing.name === "Administrador" && validatedData.isActive === false) {
      return NextResponse.json({ error: "No se puede desactivar el rol Administrador" }, { status: 403 });
    }

    const role = await prisma.role.update({
      where: { id },
      data: validatedData,
    });

    await logAudit({
      action: "UPDATE",
      entity: "Role",
      entityId: id,
      userId: admin.id,
      details: `Rol ${role.name} actualizado`,
    });

    return NextResponse.json(role);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    return handleAuthError(error) as NextResponse;
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requirePermission(request, "roles", "delete");
    const { id } = await params;

    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) return NextResponse.json({ error: "Rol no encontrado" }, { status: 404 });

    // Protect admin role
    if (role.name === "Administrador") {
      return NextResponse.json({ error: "No se puede eliminar el rol Administrador" }, { status: 403 });
    }

    // Check if role has users
    const userCount = await prisma.user.count({ where: { roleId: id } });
    if (userCount > 0) {
      return NextResponse.json({ error: "No se puede eliminar un rol con usuarios asignados" }, { status: 409 });
    }

    await prisma.role.delete({ where: { id } });

    await logAudit({
      action: "DELETE",
      entity: "Role",
      entityId: id,
      userId: admin.id,
      details: `Rol ${role.name} eliminado`,
    });

    return NextResponse.json({ message: "Rol eliminado correctamente" });
  } catch (error) {
    return handleAuthError(error) as NextResponse;
  }
}