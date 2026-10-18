import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateHrDocumentPdf } from "@/lib/hr-pdf-engine";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type");

    const where: any = {};
    if (type && type !== "ALL") {
      where.documentType = type;
    }

    if (search.trim()) {
      where.OR = [
        { candidateName: { contains: search.trim(), mode: "insensitive" } },
        { documentId: { contains: search.trim(), mode: "insensitive" } },
        { roleTitle: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const documents = await prisma.hrDocument.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ success: true, documents });
  } catch (error: any) {
    console.error("Fetch HR documents error:", error);
    return NextResponse.json({ error: error.message || "Failed to load documents" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const body = await req.json();

    const {
      candidateName,
      candidateEmail,
      candidatePhone,
      collegeName,
      department,
      documentType,
      roleTitle,
      departmentName,
      stipend,
      startDate,
      endDate,
      issueDate,
      signatoryName,
      signatoryTitle,
      signatureUrl,
      contentOverride,
    } = body;

    if (!candidateName?.trim()) {
      return NextResponse.json({ error: "Candidate name is required." }, { status: 400 });
    }

    if (!documentType) {
      return NextResponse.json({ error: "Document type is required." }, { status: 400 });
    }

    if (!roleTitle?.trim()) {
      return NextResponse.json({ error: "Role title is required." }, { status: 400 });
    }

    const org = await prisma.organization.findFirst();
    const orgId = session?.organizationId || org?.id;

    if (!orgId) {
      return NextResponse.json({ error: "Organization required" }, { status: 400 });
    }

    // Generate atomic reference code e.g. AT-HR-OL-26-001
    const typePrefixMap: Record<string, string> = {
      OFFER_LETTER: "OL",
      COMPLETION_LETTER: "CL",
      EXPERIENCE_LETTER: "EL",
      RELIEVING_LETTER: "RL",
      LOR: "LOR",
    };
    const pfx = typePrefixMap[documentType] || "DOC";
    const yearSuffix = new Date().getFullYear().toString().slice(-2);
    const count = await prisma.hrDocument.count({
      where: { documentType },
    });
    const seqNum = String(count + 1).padStart(3, "0");
    const documentId = `AT-HR-${pfx}-${yearSuffix}-${seqNum}`;

    // Generate PDF
    const pdfBytes = await generateHrDocumentPdf({
      documentId,
      documentType,
      candidateName: candidateName.trim(),
      candidateEmail: candidateEmail?.trim() || null,
      candidatePhone: candidatePhone?.trim() || null,
      collegeName: collegeName?.trim() || null,
      department: department?.trim() || null,
      roleTitle: roleTitle.trim(),
      departmentName: departmentName?.trim() || null,
      stipend: stipend?.trim() || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      issueDate: issueDate ? new Date(issueDate) : new Date(),
      signatoryName: signatoryName || "Mahesh Perla",
      signatoryTitle: signatoryTitle || "Director & Authorized Signatory",
      signatureUrl: signatureUrl || null,
      contentOverride: contentOverride?.trim() || null,
    });

    const doc = await prisma.hrDocument.create({
      data: {
        documentId,
        documentType,
        organizationId: orgId,
        candidateName: candidateName.trim(),
        candidateEmail: candidateEmail?.trim() || null,
        candidatePhone: candidatePhone?.trim() || null,
        collegeName: collegeName?.trim() || null,
        department: department?.trim() || null,
        roleTitle: roleTitle.trim(),
        departmentName: departmentName?.trim() || null,
        stipend: stipend?.trim() || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        status: "VALID",
        signatoryName: signatoryName || "Mahesh Perla",
        signatoryTitle: signatoryTitle || "Director & Authorized Signatory",
        signatureUrl: signatureUrl || null,
        pdfPath: `/api/hr-documents/${documentId}/pdf`,
        contentOverride: contentOverride?.trim() || null,
      },
    });

    await logAudit({
      organizationId: orgId,
      userId: session?.userId,
      action: "HR_DOCUMENT_GENERATED",
      entity: "HrDocument",
      entityId: doc.id,
      details: {
        documentId,
        candidateName: doc.candidateName,
        documentType,
        roleTitle: doc.roleTitle,
      },
    });

    return NextResponse.json({
      success: true,
      document: doc,
      viewUrl: `/api/hr-documents/${doc.documentId}/pdf`,
      downloadUrl: `/api/hr-documents/${doc.documentId}/pdf?download=true`,
    });
  } catch (error: any) {
    console.error("Create HR document error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to issue HR document." },
      { status: 500 }
    );
  }
}
