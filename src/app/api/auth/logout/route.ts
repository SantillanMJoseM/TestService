import { NextRequest, NextResponse } from "next/server";
import { getSessionTokenFromCookie, deleteSession, createLogoutCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie");
  const sessionToken = getSessionTokenFromCookie(cookieHeader);

  if (sessionToken) {
    await deleteSession(sessionToken);
  }

  const response = NextResponse.json({ message: "Sesión cerrada correctamente" });
  response.headers.set("Set-Cookie", createLogoutCookie());
  return response;
}