import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, handleAuthError } from "@/lib/get-user";
import { logAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/auth";
import { z } from "zod";

const createUserSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(1).max(100),
  roleId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  projectIds: z.array(z.string().uuid()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requirePermission(request, "users", "view");

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { username: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { fullName: { contains: search, mode: "insensitive" } },
      ];
    }
    if (role) where.role = role;
    if (status) where.status = status;

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, username: true, email: true, fullName: true,
        role: true, roleId: true, status: true, isActive: true,
        mustChangePassword: true, createdAt: true, updatedAt: true,
        roleRef: { select: { id: true, name: true } },
        projectAssignments: { select: { projectId: true, project: { select: { id: true, name: true } } } },
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    return handleAuthError(error) as NextResponse;
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requirePermission(request, "users", "create");
    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username: validatedData.username }, { email: validatedData.email }] },
    });
    if (existingUser) {
      return NextResponse.json({ error: "Ya existe un usuario con ese nombre de usuario o email" }, { status: 409 });
    }

    const passwordHash = await hashPassword(validatedData.password);

    const user = await prisma.user.create({
      data: {
        username: validatedData.username,
        email: validatedData.email,
        passwordHash,
        fullName: validatedData.fullName,
        role: "User",
        roleId: validatedData.roleId,
        status: "Active",
        isActive: validatedData.isActive,
      },
    });

    if (validatedData.projectIds && validatedData.projectIds.length > 0) {
      await prisma.userProject.createMany({
        data: validatedData.projectIds.map((pid) => ({ userId: user.id, projectId: pid })),
      });
    }

    await logAudit({
      action: "CREATE",
      entity: "User",
      entityId: user.id,
      userId: admin.id,
      details: `Usuario ${user.username} creado`,
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    return handleAuthError(error) as NextResponse;
  }
}