import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || id.trim() === "") {
      return NextResponse.json(
        { error: "Certificate ID is required." },
        { status: 400 }
      );
    }

    const cleanId = id.trim().toUpperCase();

    // Query certificate
    const cert = await prisma.certificate.findUnique({
      where: { certificateId: cleanId },
      include: {
        program: {
          select: { name: true, duration: true },
        },
        organization: {
          select: { name: true, website: true },
        },
        revokedBy: {
          select: { name: true },
        },
      },
    });

    const ipAddress = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    if (!cert) {
      // Record not found query in logs
      await prisma.verificationLog.create({
        data: {
          searchedId: cleanId,
          isFound: false,
          status: "NOT_FOUND",
          ipAddress,
          userAgent,
        },
      });

      return NextResponse.json({
        found: false,
        message: "No certificate found matching the provided Certificate ID.",
      }, { status: 404 });
    }

    // Increment verification count and log
    await prisma.$transaction([
      prisma.certificate.update({
        where: { id: cert.id },
        data: { verificationCount: { increment: 1 } },
      }),
      prisma.verificationLog.create({
        data: {
          certificateId: cert.id,
          searchedId: cleanId,
          isFound: true,
          status: cert.status,
          ipAddress,
          userAgent,
        },
      }),
      prisma.certificateEvent.create({
        data: {
          certificateId: cert.id,
          eventType: "VERIFIED",
          actor: "PUBLIC",
          details: JSON.stringify({ ipAddress }),
        },
      }),
    ]);

    // Return public verification record (strictly masking private candidate info)
    return NextResponse.json({
      found: true,
      status: cert.status, // VALID or REVOKED
      certificateId: cert.certificateId,
      candidateName: cert.candidateName,
      programName: cert.program.name,
      organizationName: cert.organization.name,
      issueDate: cert.issueDate,
      startDate: cert.startDate,
      endDate: cert.endDate,
      pdfPath: cert.pdfPath,
      verificationCount: cert.verificationCount + 1,
      revocation: cert.status === "REVOKED" ? {
        revokedAt: cert.revokedAt,
        reason: cert.revocationReason || "Revoked by issuing authority",
        revokedBy: cert.revokedBy?.name || "Issuing Authority",
      } : null,
    });
  } catch (error: any) {
    console.error("Verification lookup error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while verifying certificate." },
      { status: 500 }
    );
  }
}
