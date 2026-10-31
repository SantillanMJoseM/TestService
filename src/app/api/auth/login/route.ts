import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession, createSessionCookie } from "@/lib/auth";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(1, "El nombre de usuario es obligatorio"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { username: validatedData.username },
      include: { roleRef: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    // Check user status
    if (user.status !== "Active") {
      const statusMessages: Record<string, string> = {
        Pending: "Tu cuenta está pendiente de aprobación por un administrador",
        Rejected: "Tu cuenta ha sido rechazada",
        Suspended: "Tu cuenta ha sido suspendida",
      };
      return NextResponse.json(
        { error: statusMessages[user.status] || "Cuenta no activa" },
        { status: 403 }
      );
    }

    const isValid = await verifyPassword(validatedData.password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const sessionToken = await createSession(user.id);

    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        roleId: user.roleId,
        mustChangePassword: user.mustChangePassword,
      },
    });

    response.headers.set("Set-Cookie", createSessionCookie(sessionToken));
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    console.error("Error al iniciar sesión:", error);
    return NextResponse.json({ error: "Error al iniciar sesión" }, { status: 500 });
  }
}