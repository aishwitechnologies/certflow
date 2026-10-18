import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateHrDocumentPdf } from "@/lib/hr-pdf-engine";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const docId = params.id;
    const { searchParams } = new URL(req.url);
    const forceDownload = searchParams.get("download") === "true";

    const doc = await prisma.hrDocument.findFirst({
      where: {
        OR: [{ id: docId }, { documentId: docId }],
      },
    });

    if (!doc) {
      return NextResponse.json({ error: "HR Document not found." }, { status: 404 });
    }

    const cleanCandidateName = doc.candidateName.replace(/[^a-zA-Z0-9_-]/g, "_");
    const downloadFilename = `Aishwi_${doc.documentType}_${cleanCandidateName}_${doc.documentId}.pdf`;

    const pdfBytes = await generateHrDocumentPdf({
      documentId: doc.documentId,
      documentType: doc.documentType as any,
      candidateName: doc.candidateName,
      candidateEmail: doc.candidateEmail,
      candidatePhone: doc.candidatePhone,
      collegeName: doc.collegeName,
      department: doc.department,
      roleTitle: doc.roleTitle,
      departmentName: doc.departmentName,
      stipend: doc.stipend,
      startDate: doc.startDate,
      endDate: doc.endDate,
      issueDate: doc.issueDate,
      signatoryName: doc.signatoryName,
      signatoryTitle: doc.signatoryTitle,
      signatureUrl: doc.signatureUrl,
      contentOverride: doc.contentOverride,
      templateUrl: doc.templateUrl,
      letterheadMode: doc.letterheadMode || "STANDARD",
      topMargin: doc.topMargin,
      bottomMargin: doc.bottomMargin,
      leftMargin: doc.leftMargin,
      rightMargin: doc.rightMargin,
      hideDefaultHeaderFooter: doc.hideDefaultHeaderFooter,
      includeSeal: doc.includeSeal,
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
    console.error("HR Document PDF error:", error);
    return NextResponse.json({ error: error.message || "Failed to render HR Document" }, { status: 500 });
  }
}
