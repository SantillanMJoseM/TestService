import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, handleAuthError } from "@/lib/get-user";
import { logAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/auth";
import { z } from "zod";

const updateUserSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  fullName: z.string().min(1).max(100).optional(),
  roleId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
  status: z.enum(["Active", "Pending", "Rejected", "Suspended"]).optional(),
  projectIds: z.array(z.string().uuid()).optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission(request, "users", "view");
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, username: true, email: true, fullName: true,
        role: true, roleId: true, status: true, isActive: true,
        mustChangePassword: true, createdAt: true, updatedAt: true,
        roleRef: { select: { id: true, name: true, description: true } },
        projectAssignments: { select: { projectId: true, project: { select: { id: true, name: true, key: true } } } },
      },
    });
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    return NextResponse.json(user);
  } catch (error) {
    return handleAuthError(error) as NextResponse;
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requirePermission(request, "users", "edit");
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    // Prevent self-privilege escalation
    if (id === admin.id && validatedData.roleId !== undefined && validatedData.roleId !== existing.roleId) {
      return NextResponse.json({ error: "No puede modificar su propio rol" }, { status: 403 });
    }

    const data: Record<string, unknown> = {};
    if (validatedData.username !== undefined) data.username = validatedData.username;
    if (validatedData.email !== undefined) data.email = validatedData.email;
    if (validatedData.fullName !== undefined) data.fullName = validatedData.fullName;
    if (validatedData.roleId !== undefined) data.roleId = validatedData.roleId;
    if (validatedData.isActive !== undefined) data.isActive = validatedData.isActive;
    if (validatedData.status !== undefined) data.status = validatedData.status;
    if (validatedData.password) data.passwordHash = await hashPassword(validatedData.password);

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, username: true, email: true, fullName: true, role: true, roleId: true, status: true, isActive: true },
    });

    // Update project assignments if provided
    if (validatedData.projectIds !== undefined) {
      await prisma.userProject.deleteMany({ where: { userId: id } });
      if (validatedData.projectIds.length > 0) {
        await prisma.userProject.createMany({
          data: validatedData.projectIds.map((pid) => ({ userId: id, projectId: pid })),
        });
      }
    }

    // If suspended/rejected, invalidate sessions
    if (validatedData.status === "Suspended" || validatedData.status === "Rejected") {
      await prisma.session.deleteMany({ where: { userId: id } });
    }

    // If password changed, invalidate sessions
    if (validatedData.password) {
      await prisma.session.deleteMany({ where: { userId: id } });
    }

    await logAudit({
      action: "UPDATE",
      entity: "User",
      entityId: id,
      userId: admin.id,
      details: `Usuario ${user.username} actualizado`,
    });

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    return handleAuthError(error) as NextResponse;
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requirePermission(request, "users", "delete");
    const { id } = await params;

    if (id === admin.id) {
      return NextResponse.json({ error: "No puede eliminar su propia cuenta" }, { status: 403 });
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    await prisma.session.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });

    await logAudit({
      action: "DELETE",
      entity: "User",
      entityId: id,
      userId: admin.id,
      details: `Usuario ${existing.username} eliminado`,
    });

    return NextResponse.json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    return handleAuthError(error) as NextResponse;
  }
}