import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, handleAuthError } from "@/lib/get-user";
import { logAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requirePermission(request, "registration-requests", "view");
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";

    const where: Record<string, string> = {};
    if (status) where.status = status;

    const requests = await prisma.registrationRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (error) {
    return handleAuthError(error) as NextResponse;
  }
}