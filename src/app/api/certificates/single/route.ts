import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { reserveCertificateIds } from "@/lib/id-generator";
import { generateCertificatePdf } from "@/lib/pdf-engine";
import { generatePdfFilename } from "@/lib/utils";
import { saveFile } from "@/lib/storage";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const body = await req.json();

    const {
      candidateName,
      email,
      collegeName,
      department,
      programId,
      templateId,
      domain,
      startDate,
      endDate,
      issueDate,
      signatureUrl,
    } = body;

    if (!candidateName?.trim()) {
      return NextResponse.json({ error: "Candidate name is required." }, { status: 400 });
    }

    if (!programId) {
      return NextResponse.json({ error: "Program selection is required." }, { status: 400 });
    }

    if (!templateId) {
      return NextResponse.json({ error: "Template selection is required." }, { status: 400 });
    }

    // 1. Fetch program and template
    const [program, template] = await Promise.all([
      prisma.program.findUnique({
        where: { id: programId },
        include: { organization: true },
      }),
      prisma.certificateTemplate.findUnique({
        where: { id: templateId },
        include: { fields: true },
      }),
    ]);

    if (!program) {
      return NextResponse.json({ error: "Selected program not found." }, { status: 404 });
    }

    if (!template) {
      return NextResponse.json({ error: "Selected template not found." }, { status: 404 });
    }

    const orgId = session?.organizationId || program.organizationId;
    const issueDateObj = issueDate ? new Date(issueDate) : new Date();

    // 2. Reserve atomic unique sequence ID (e.g. AT-10-02)
    const [certId] = await reserveCertificateIds(orgId, 1, issueDateObj);

    // 3. Upsert Candidate
    const candidateEmail = email?.trim().toLowerCase() || `${candidateName.toLowerCase().replace(/[^a-z0-9]/g, "")}.${Date.now()}@aishwitechnologies.com`;
    const candidate = await prisma.candidate.upsert({
      where: {
        organizationId_email_programId: {
          organizationId: orgId,
          email: candidateEmail,
          programId,
        },
      },
      update: {
        name: candidateName.trim(),
        college: collegeName?.trim() || undefined,
        department: department?.trim() || undefined,
        domain: domain?.trim() || undefined,
      },
      create: {
        organizationId: orgId,
        name: candidateName.trim(),
        email: candidateEmail,
        college: collegeName?.trim() || null,
        department: department?.trim() || null,
        domain: domain?.trim() || null,
        programId,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    const formatDateStr = (d?: string | Date | null) => {
      if (!d) return "";
      return new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    };

    // 4. Generate Certificate PDF using pdf-lib engine
    const pdfBytes = await generateCertificatePdf({
      template: {
        width: template.width,
        height: template.height,
        orientation: template.orientation,
        backgroundUrl: template.backgroundUrl,
        signatureUrl: signatureUrl || template.signatureUrl,
        fields: template.fields.map((f) => ({
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
        NAME: candidateName.trim(),
        CERTIFICATE_ID: certId,
        PROGRAM_NAME: program.name,
        COLLEGE_NAME: collegeName?.trim() || "",
        DEPARTMENT: department?.trim() || "",
        DOMAIN: domain?.trim() || "",
        START_DATE: formatDateStr(startDate),
        END_DATE: formatDateStr(endDate),
        ISSUE_DATE: formatDateStr(issueDateObj),
        ORGANIZATION_NAME: program.organization?.name || "AISHWI TECHNOLOGIES",
        SIGNATURE_URL: signatureUrl || template.signatureUrl,
      },
    });

    // 5. Save generated PDF to storage
    const pdfFilename = generatePdfFilename(candidateName.trim(), certId);
    let savedPdfUrl = "";
    try {
      savedPdfUrl = await saveFile("certificates", pdfFilename, Buffer.from(pdfBytes));
    } catch (saveErr) {
      console.warn("Storage warning (will fallback to on-the-fly rendering):", saveErr);
    }

    // 6. Create Certificate record in database
    const certificate = await prisma.certificate.create({
      data: {
        certificateId: certId,
        organizationId: orgId,
        candidateId: candidate.id,
        programId,
        templateId,
        candidateName: candidateName.trim(),
        collegeName: collegeName?.trim() || null,
        department: department?.trim() || null,
        domain: domain?.trim() || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        issueDate: issueDateObj,
        status: "VALID",
        pdfPath: `/api/certificates/${certId}/pdf`,
        verificationUrl: `/verify/${certId}`,
      },
      include: {
        program: { select: { id: true, name: true } },
        template: { select: { id: true, name: true } },
      },
    });

    // 7. Log audit event
    await logAudit({
      organizationId: orgId,
      userId: session?.userId || null,
      action: "CERTIFICATE_GENERATED",
      entity: "Certificate",
      entityId: certificate.id,
      details: {
        certificateId: certId,
        candidateName: candidateName.trim(),
        programName: program.name,
        generationType: "MANUAL_SINGLE",
      },
    });

    return NextResponse.json({
      success: true,
      certificate,
      certificateId: certId,
      viewUrl: `/api/certificates/${certificate.id}/pdf`,
      downloadUrl: `/api/certificates/${certificate.id}/pdf?download=true`,
      verificationUrl: `/verify/${certId}`,
    });
  } catch (error: any) {
    console.error("Single certificate generation failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate certificate." },
      { status: 500 }
    );
  }
}
