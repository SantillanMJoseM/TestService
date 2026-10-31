import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, handleAuthError } from "@/lib/get-user";

export async function GET(request: NextRequest) {
  try {
    await requirePermission(request, "roles", "view");
    const permissions = await prisma.permission.findMany({
      orderBy: [{ section: "asc" }, { action: "asc" }],
    });
    return NextResponse.json(permissions);
  } catch (error) {
    return handleAuthError(error) as NextResponse;
  }
}