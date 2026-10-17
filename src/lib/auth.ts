import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "certflow-default-secret-change-in-production";
export const AUTH_COOKIE_NAME = "certflow_auth_token";

export type Role = "SUPER_ADMIN" | "ADMIN" | "OPERATOR" | "VIEWER";

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: Role;
  organizationId: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<TokenPayload | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export async function requireAuth(allowedRoles?: Role[]): Promise<TokenPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
    throw new Error("FORBIDDEN");
  }

  return session;
}

export function canGenerateCertificates(role: Role): boolean {
  return ["SUPER_ADMIN", "ADMIN", "OPERATOR"].includes(role);
}

export function canRevokeCertificates(role: Role): boolean {
  return ["SUPER_ADMIN", "ADMIN"].includes(role);
}

export function canManageSettings(role: Role): boolean {
  return role === "SUPER_ADMIN";
}

export function canManageUsers(role: Role): boolean {
  return role === "SUPER_ADMIN";
}

export function canManageTemplates(role: Role): boolean {
  return ["SUPER_ADMIN", "ADMIN"].includes(role);
}
