import { NextRequest, NextResponse } from "next/server";
import { generateHrDocumentPdf } from "@/lib/hr-pdf-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const pdfBytes = await generateHrDocumentPdf({
      documentId: body.documentId || "AT-HR-PREVIEW",
      documentType: body.documentType || "OFFER_LETTER",
      candidateName: body.candidateName || "Candidate Full Name",
      candidateEmail: body.candidateEmail || "candidate@example.com",
      candidatePhone: body.candidatePhone || null,
      collegeName: body.collegeName || "Institution / College Name",
      department: body.department || "Computer Science & Engineering",
      roleTitle: body.roleTitle || "Artificial Intelligence Intern",
      departmentName: body.departmentName || "Engineering & Innovation Group",
      stipend: body.stipend || "Performance Based",
      startDate: body.startDate || new Date(),
      endDate: body.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      issueDate: body.issueDate || new Date(),
      signatoryName: body.signatoryName || "Mahesh Perla",
      signatoryTitle: body.signatoryTitle || "Director & Authorized Signatory",
      signatureUrl: body.signatureUrl || null,
      contentOverride: body.contentOverride || null,
      templateUrl: body.templateUrl || null,
      letterheadMode: body.letterheadMode || "STANDARD",
      topMargin: body.topMargin !== undefined ? Number(body.topMargin) : null,
      bottomMargin: body.bottomMargin !== undefined ? Number(body.bottomMargin) : null,
      leftMargin: body.leftMargin !== undefined ? Number(body.leftMargin) : null,
      rightMargin: body.rightMargin !== undefined ? Number(body.rightMargin) : null,
      hideDefaultHeaderFooter: body.hideDefaultHeaderFooter,
      includeSeal: body.includeSeal,
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="hr_preview.pdf"',
      },
    });
  } catch (error: any) {
    console.error("HR Preview error:", error);
    return NextResponse.json(
      { error: `Preview failed: ${error.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}
