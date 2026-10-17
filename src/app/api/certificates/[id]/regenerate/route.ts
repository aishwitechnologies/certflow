import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, canGenerateCertificates } from "@/lib/auth";
import { generateCertificatePdf } from "@/lib/pdf-engine";
import { generatePdfFilename } from "@/lib/utils";
import { saveFile } from "@/lib/storage";
import { logAudit } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();

    if (!canGenerateCertificates(session.role)) {
      return NextResponse.json({ error: "Unauthorized to regenerate certificates." }, { status: 403 });
    }

    const { candidateName, collegeName, department, domain } = await req.json();
    const certificateId = params.id;

    const cert = await prisma.certificate.findFirst({
      where: {
        OR: [{ id: certificateId }, { certificateId }],
      },
      include: {
        template: {
          include: { fields: true },
        },
        program: true,
      },
    });

    if (!cert) {
      return NextResponse.json({ error: "Certificate not found." }, { status: 404 });
    }

    const updatedName = candidateName || cert.candidateName;
    const updatedCollege = collegeName !== undefined ? collegeName : cert.collegeName;
    const updatedDept = department !== undefined ? department : cert.department;
    const updatedDomain = domain !== undefined ? domain : cert.domain;

    // Generate new PDF with updated information
    const issueDateStr = cert.issueDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const pdfBytes = await generateCertificatePdf({
      template: {
        width: cert.template.width,
        height: cert.template.height,
        orientation: cert.template.orientation,
        backgroundUrl: cert.template.backgroundUrl,
        fields: cert.template.fields.map((f) => ({
          fieldKey: f.fieldKey,
          label: f.label,
          x: f.x,
          y: f.y,
          fontSize: f.fontSize,
          fontFamily: f.fontFamily,
          fontWeight: f.fontWeight,
          color: f.color,
          alignment: f.alignment as any,
          staticValue: f.staticValue,
        })),
      },
      data: {
        NAME: updatedName,
        CERTIFICATE_ID: cert.certificateId,
        PROGRAM_NAME: cert.program.name,
        COLLEGE_NAME: updatedCollege || "",
        DEPARTMENT: updatedDept || "",
        DOMAIN: updatedDomain || "",
        ISSUE_DATE: issueDateStr,
        ORGANIZATION_NAME: "Acme Tech Innovations",
      },
    });

    const newFilename = generatePdfFilename(updatedName, cert.certificateId);
    const newPdfPath = await saveFile("certificates", newFilename, pdfBytes);

    // Update certificate record
    const updatedCert = await prisma.certificate.update({
      where: { id: cert.id },
      data: {
        candidateName: updatedName,
        collegeName: updatedCollege,
        department: updatedDept,
        domain: updatedDomain,
        pdfPath: newPdfPath,
        updatedAt: new Date(),
      },
    });

    // Record Event
    await prisma.certificateEvent.create({
      data: {
        certificateId: cert.id,
        eventType: "REGENERATED",
        actor: session.email,
        details: JSON.stringify({
          previousName: cert.candidateName,
          newName: updatedName,
          newPdfPath,
        }),
      },
    });

    await logAudit({
      organizationId: cert.organizationId,
      userId: session.userId,
      action: "CERTIFICATE_REGENERATED",
      entity: "Certificate",
      entityId: cert.id,
      details: {
        certificateId: cert.certificateId,
        newName: updatedName,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Certificate ${cert.certificateId} regenerated successfully.`,
      certificate: updatedCert,
    });
  } catch (error: any) {
    console.error("Regenerate certificate error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to regenerate certificate." },
      { status: 500 }
    );
  }
}
