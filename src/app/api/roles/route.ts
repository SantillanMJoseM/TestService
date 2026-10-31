import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, handleAuthError } from "@/lib/get-user";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const createRoleSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(50),
  description: z.string().max(200).optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

const updateRoleSchema = createRoleSchema.partial();

export async function GET(request: NextRequest) {
  try {
    await requirePermission(request, "roles", "view");
    const roles = await prisma.role.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { users: true, permissions: true } },
      },
    });
    return NextResponse.json(roles);
  } catch (error) {
    return handleAuthError(error) as NextResponse;
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requirePermission(request, "roles", "create");
    const body = await request.json();
    const validatedData = createRoleSchema.parse(body);

    const existing = await prisma.role.findUnique({ where: { name: validatedData.name } });
    if (existing) {
      return NextResponse.json({ error: "Ya existe un rol con ese nombre" }, { status: 409 });
    }

    const role = await prisma.role.create({ data: validatedData });

    await logAudit({
      action: "CREATE",
      entity: "Role",
      entityId: role.id,
      userId: admin.id,
      details: `Rol ${role.name} creado`,
    });

    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    return handleAuthError(error) as NextResponse;
  }
}