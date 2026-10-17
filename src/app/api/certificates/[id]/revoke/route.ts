import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, canRevokeCertificates } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();

    if (!canRevokeCertificates(session.role)) {
      return NextResponse.json({ error: "Unauthorized to revoke certificates." }, { status: 403 });
    }

    const { reason } = await req.json();
    const certificateId = params.id;

    const cert = await prisma.certificate.findFirst({
      where: {
        OR: [{ id: certificateId }, { certificateId }],
      },
    });

    if (!cert) {
      return NextResponse.json({ error: "Certificate not found." }, { status: 404 });
    }

    const updated = await prisma.certificate.update({
      where: { id: cert.id },
      data: {
        status: "REVOKED",
        revokedAt: new Date(),
        revokedById: session.userId,
        revocationReason: reason || "Revoked by administrator",
      },
    });

    await prisma.certificateEvent.create({
      data: {
        certificateId: cert.id,
        eventType: "REVOKED",
        actor: session.email,
        details: JSON.stringify({ reason }),
      },
    });

    await logAudit({
      organizationId: cert.organizationId,
      userId: session.userId,
      action: "CERTIFICATE_REVOKED",
      entity: "Certificate",
      entityId: cert.id,
      details: { certificateId: cert.certificateId, reason },
    });

    return NextResponse.json({
      success: true,
      message: `Certificate ${cert.certificateId} has been revoked.`,
      certificate: updated,
    });
  } catch (error: any) {
    console.error("Revoke certificate error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to revoke certificate." },
      { status: 500 }
    );
  }
}
