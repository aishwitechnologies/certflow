import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateCertificatePdf } from "@/lib/pdf-engine";
import { formatCertificateId, getOrgIdConfig } from "@/lib/id-generator";

export async function POST(req: NextRequest) {
  try {
    const { templateId, candidateData } = await req.json();

    if (!templateId) {
      return NextResponse.json({ error: "Template ID is required." }, { status: 400 });
    }

    const template = await prisma.certificateTemplate.findUnique({
      where: { id: templateId },
      include: { fields: true },
    });

    if (!template) {
      return NextResponse.json({ error: "Certificate template not found." }, { status: 404 });
    }

    const orgConfig = await getOrgIdConfig(template.organizationId);
    const previewCertId = formatCertificateId(1, orgConfig, new Date());

    const sampleCandidate = candidateData || {
      candidateName: "Ravi Kumar",
      programName: "AI Internship",
      collegeName: "ABC College of Engineering",
      department: "Computer Science & Engineering",
      domain: "Artificial Intelligence",
      startDate: "01-10-2026",
      endDate: "31-10-2026",
    };

    const pdfBytes = await generateCertificatePdf({
      template: {
        width: template.width,
        height: template.height,
        orientation: template.orientation,
        backgroundUrl: template.backgroundUrl,
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
        NAME: sampleCandidate.candidateName || "Candidate Name",
        CERTIFICATE_ID: previewCertId,
        PROGRAM_NAME: sampleCandidate.programName || "Program Name",
        COLLEGE_NAME: sampleCandidate.collegeName || "Institution Name",
        DEPARTMENT: sampleCandidate.department || "Engineering",
        DOMAIN: sampleCandidate.domain || "Technology",
        START_DATE: sampleCandidate.startDate || "01-10-2026",
        END_DATE: sampleCandidate.endDate || "31-10-2026",
        ISSUE_DATE: new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      },
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="certificate_preview.pdf"',
      },
    });
  } catch (error: any) {
    console.error("Preview error:", error);
    return NextResponse.json(
      { error: `Preview failed: ${error.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}
