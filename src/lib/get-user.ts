import { getSessionTokenFromCookie, getSession, hasPermission, getUserProjects, canAccessProject } from "./auth";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  roleId: string | null;
  status: string;
  mustChangePassword: boolean;
}

export async function getAuthUser(request: Request): Promise<AuthUser | null> {
  const cookieHeader = request.headers.get("cookie");
  const sessionToken = getSessionTokenFromCookie(cookieHeader);

  if (!sessionToken) return null;

  const session = await getSession(sessionToken);
  if (!session) return null;

  return {
    id: session.user.id,
    username: session.user.username,
    email: session.user.email,
    fullName: session.user.fullName,
    role: session.user.role,
    roleId: session.user.roleId,
    status: session.user.status,
    mustChangePassword: session.user.mustChangePassword,
  };
}

export async function requireAuth(request: Request): Promise<AuthUser> {
  const user = await getAuthUser(request);
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requirePermission(request: Request, section: string, action: string): Promise<AuthUser> {
  const user = await requireAuth(request);
  if (user.role !== "Admin") {
    const allowed = await hasPermission(user.id, section, action);
    if (!allowed) {
      throw new Error("FORBIDDEN");
    }
  }
  return user;
}

export async function requireAdmin(request: Request): Promise<AuthUser> {
  const user = await requireAuth(request);
  if (user.role !== "Admin") {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export function handleAuthError(error: unknown): Response {
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") {
      return Response.json({ error: "No autenticado" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return Response.json({ error: "No tiene permisos para esta operación" }, { status: 403 });
    }
  }
  return Response.json({ error: "Error interno del servidor" }, { status: 500 });
}