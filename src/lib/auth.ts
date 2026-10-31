import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const SALT_ROUNDS = 10;
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string): Promise<string> {
  const sessionToken = crypto.randomUUID();
  const expires = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: { sessionToken, userId, expires },
  });

  return sessionToken;
}

export async function getSession(sessionToken: string) {
  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: { user: { include: { roleRef: true, projectAssignments: { include: { project: true } } } } },
  });

  if (!session) return null;
  if (session.expires < new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  // Check user status
  if (!session.user.isActive || session.user.status !== "Active") {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return session;
}

export async function deleteSession(sessionToken: string) {
  try {
    await prisma.session.delete({ where: { sessionToken } });
  } catch {
    // Session may not exist
  }
}

export async function deleteAllUserSessions(userId: string) {
  await prisma.session.deleteMany({ where: { userId } });
}

export function getSessionTokenFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map((c) => c.trim());
  const sessionCookie = cookies.find((c) => c.startsWith("session="));
  if (!sessionCookie) return null;
  return sessionCookie.split("=")[1] || null;
}

export function createSessionCookie(token: string): string {
  const maxAge = SESSION_DURATION_MS / 1000;
  return `session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

export function createLogoutCookie(): string {
  return "session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0";
}

export async function hasPermission(userId: string, section: string, action: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roleRef: { include: { permissions: { include: { permission: true } } } } },
  });

  if (!user) return false;
  if (user.role === "Admin") return true; // Legacy admin

  if (!user.roleRef) return false;

  return user.roleRef.permissions.some(
    (rp) => rp.permission.section === section && rp.permission.action === action
  );
}

export async function getUserProjects(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { projectAssignments: true },
  });

  if (!user) return [];
  if (user.role === "Admin") {
    // Admin can see all projects
    const allProjects = await prisma.project.findMany({ select: { id: true } });
    return allProjects.map((p) => p.id);
  }

  return user.projectAssignments.map((pa) => pa.projectId);
}

export async function canAccessProject(userId: string, projectId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { projectAssignments: true },
  });

  if (!user) return false;
  if (user.role === "Admin") return true;

  return user.projectAssignments.some((pa) => pa.projectId === projectId);
}