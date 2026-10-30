import { NextRequest, NextResponse } from "next/server";
import { getSessionTokenFromCookie, getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie");
  const sessionToken = getSessionTokenFromCookie(cookieHeader);

  if (!sessionToken) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const session = await getSession(sessionToken);
  if (!session) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json({
    user: {
      id: session.user.id,
      username: session.user.username,
      email: session.user.email,
      fullName: session.user.fullName,
      role: session.user.role,
    },
  });
}