import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, handleAuthError } from "@/lib/get-user";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const updatePermissionsSchema = z.object({
  permissionIds: z.array(z.string().uuid()),
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
      },
    });
    if (!role) return NextResponse.json({ error: "Rol no encontrado" }, { status: 404 });
    return NextResponse.json(role.permissions.map((rp) => rp.permission));
  } catch (error) {
    return handleAuthError(error) as NextResponse;
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requirePermission(request, "roles", "edit");
    const { id } = await params;
    const body = await request.json();
    const validatedData = updatePermissionsSchema.parse(body);

    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) return NextResponse.json({ error: "Rol no encontrado" }, { status: 404 });

    // Protect admin role
    if (role.name === "Administrador") {
      return NextResponse.json({ error: "No se pueden modificar los permisos del rol Administrador" }, { status: 403 });
    }

    // Replace all permissions
    await prisma.rolePermission.deleteMany({ where: { roleId: id } });
    if (validatedData.permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: validatedData.permissionIds.map((pid) => ({ roleId: id, permissionId: pid })),
      });
    }

    await logAudit({
      action: "UPDATE",
      entity: "RolePermission",
      entityId: id,
      userId: admin.id,
      details: `Permisos del rol ${role.name} actualizados`,
    });

    return NextResponse.json({ message: "Permisos actualizados correctamente" });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    return handleAuthError(error) as NextResponse;
  }
}