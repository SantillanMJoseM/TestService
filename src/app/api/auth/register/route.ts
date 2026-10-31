import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  username: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres").max(30),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  fullName: z.string().min(1, "El nombre completo es obligatorio").max(100),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Check for duplicate username or email in users
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username: validatedData.username }, { email: validatedData.email }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Ya existe un usuario con ese nombre de usuario o email" },
        { status: 409 }
      );
    }

    // Check for duplicate in registration requests
    const existingRequest = await prisma.registrationRequest.findFirst({
      where: {
        OR: [{ username: validatedData.username }, { email: validatedData.email }],
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "Ya existe una solicitud de registro con ese nombre de usuario o email" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(validatedData.password, 10);

    const request_ = await prisma.registrationRequest.create({
      data: {
        username: validatedData.username,
        email: validatedData.email,
        passwordHash,
        fullName: validatedData.fullName,
        status: "Pending",
      },
    });

    return NextResponse.json(
      { message: "Solicitud de registro enviada. Un administrador la revisará.", id: request_.id },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    console.error("Error al registrar:", error);
    return NextResponse.json({ error: "Error al registrar" }, { status: 500 });
  }
}