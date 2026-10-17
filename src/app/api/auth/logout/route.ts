import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await getSession();

  if (session) {
    await logAudit({
      organizationId: session.organizationId,
      userId: session.userId,
      action: "LOGOUT",
      entity: "User",
      entityId: session.userId,
    });
  }

  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}
