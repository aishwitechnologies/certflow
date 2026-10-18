import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, signToken, AUTH_COOKIE_NAME, Role } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const ALLOWED_SUPERADMIN_EMAILS = [
  "mahesh.perla@aishwitech.in",
  "ganesh@aishwitech.in",
  "ruthvik.sonti@aishwitech.in",
];

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!ALLOWED_SUPERADMIN_EMAILS.includes(normalizedEmail)) {
      return NextResponse.json(
        { error: "Access restricted. Only authorized Aishwi Technologies Super Admins can log in." },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { organization: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Invalid credentials or inactive account." },
        { status: 401 }
      );
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 401 }
      );
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
      organizationId: user.organizationId,
    });

    await logAudit({
      organizationId: user.organizationId,
      userId: user.id,
      action: "LOGIN",
      entity: "User",
      entityId: user.id,
      details: { email: user.email },
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: {
          id: user.organization.id,
          name: user.organization.name,
        },
      },
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}
