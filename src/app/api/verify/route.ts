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

    if (cert) {
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
        isHrDocument: false,
        status: cert.status, // VALID or REVOKED
        certificateId: cert.certificateId,
        candidateName: cert.candidateName,
        programName: cert.program.name,
        organizationName: cert.organization.name,
        issueDate: cert.issueDate,
        startDate: cert.startDate,
        endDate: cert.endDate,
        pdfPath: cert.pdfPath,
        pdfDownloadUrl: `/api/certificates/${cert.certificateId}/pdf?download=true`,
        pdfViewUrl: `/api/certificates/${cert.certificateId}/pdf`,
        verificationCount: cert.verificationCount + 1,
        revocation: cert.status === "REVOKED" ? {
          revokedAt: cert.revokedAt,
          reason: cert.revocationReason || "Revoked by issuing authority",
          revokedBy: cert.revokedBy?.name || "Issuing Authority",
        } : null,
      });
    }

    // 2. If not found in certificates, check HrDocument table
    const hrDoc = await prisma.hrDocument.findUnique({
      where: { documentId: cleanId },
      include: {
        organization: {
          select: { name: true, website: true },
        },
      },
    });

    if (hrDoc) {
      await prisma.hrDocumentVerificationLog.create({
        data: {
          documentId: hrDoc.id,
          searchedId: cleanId,
          ipAddress,
          userAgent,
        },
      });

      const count = await prisma.hrDocumentVerificationLog.count({
        where: { documentId: hrDoc.id },
      });

      const docTypeLabels: Record<string, string> = {
        OFFER_LETTER: "Internship Offer Letter",
        COMPLETION_LETTER: "Internship Completion Letter",
        EXPERIENCE_LETTER: "Work Experience Letter",
        RELIEVING_LETTER: "Relieving Letter",
        LOR: "Letter of Recommendation (LOR)",
      };

      return NextResponse.json({
        found: true,
        isHrDocument: true,
        documentType: hrDoc.documentType,
        documentTypeLabel: docTypeLabels[hrDoc.documentType] || hrDoc.documentType.replace(/_/g, " "),
        status: hrDoc.status,
        certificateId: hrDoc.documentId,
        candidateName: hrDoc.candidateName,
        programName: `${hrDoc.roleTitle}${hrDoc.department ? ` - ${hrDoc.department}` : ""}`,
        roleTitle: hrDoc.roleTitle,
        department: hrDoc.department,
        organizationName: hrDoc.organization?.name || "Aishwi Technologies",
        issueDate: hrDoc.issueDate,
        startDate: hrDoc.startDate,
        endDate: hrDoc.endDate,
        pdfDownloadUrl: `/api/hr-documents/${hrDoc.id}/pdf?download=true`,
        pdfViewUrl: `/api/hr-documents/${hrDoc.id}/pdf`,
        verificationCount: count,
      });
    }

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
      message: "No certificate or official HR letter found matching the provided ID.",
    }, { status: 404 });
  } catch (error: any) {
    console.error("Verification lookup error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while verifying credential." },
      { status: 500 }
    );
  }
}
