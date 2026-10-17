import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateCertificatePdf } from "@/lib/pdf-engine";
import { readFile } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const certId = params.id;
    const { searchParams } = new URL(req.url);
    const forceDownload = searchParams.get("download") === "true";

    // 1. Fetch certificate from database by ID or Certificate ID (e.g. AT-10-01)
    const certificate = await prisma.certificate.findFirst({
      where: {
        OR: [{ id: certId }, { certificateId: certId }],
      },
      include: {
        template: {
          include: { fields: true },
        },
        program: true,
        candidate: true,
        organization: true,
      },
    });

    if (!certificate) {
      return NextResponse.json({ error: "Certificate not found." }, { status: 404 });
    }

    const cleanCandidateName = certificate.candidateName.replace(/[^a-zA-Z0-9_-]/g, "_");
    const downloadFilename = `${cleanCandidateName}_${certificate.certificateId}.pdf`;

    // 2. Check if already saved in storage
    if (certificate.pdfPath) {
      const filename = certificate.pdfPath.split("/").pop()?.split("?")[0];
      if (filename) {
        const existingBytes = readFile("certificates", filename);
        if (existingBytes) {
          return new NextResponse(existingBytes, {
            status: 200,
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": `${forceDownload ? "attachment" : "inline"}; filename="${downloadFilename}"`,
              "Cache-Control": "public, max-age=3600",
            },
          });
        }
      }
    }

    // 3. If file not in storage (e.g. Vercel serverless ephemeral container), regenerate on the fly!
    const template = certificate.template;
    if (!template) {
      return NextResponse.json(
        { error: "Template configuration missing for this certificate." },
        { status: 400 }
      );
    }

    const formatDateStr = (date: Date | null) => {
      if (!date) return "";
      return new Date(date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
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
        NAME: certificate.candidateName,
        CERTIFICATE_ID: certificate.certificateId,
        PROGRAM_NAME: certificate.program.name,
        COLLEGE_NAME: certificate.collegeName || "",
        DEPARTMENT: certificate.department || "",
        DOMAIN: certificate.domain || "",
        START_DATE: formatDateStr(certificate.startDate),
        END_DATE: formatDateStr(certificate.endDate),
        ISSUE_DATE: formatDateStr(certificate.issueDate),
        ORGANIZATION_NAME: certificate.organization.name || "AISHWI TECHNOLOGIES",
      },
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${forceDownload ? "attachment" : "inline"}; filename="${downloadFilename}"`,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error: any) {
    console.error("Certificate PDF view error:", error);
    return NextResponse.json({ error: error.message || "Failed to render certificate" }, { status: 500 });
  }
}
