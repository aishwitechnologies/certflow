import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const { programId, templateId, validRecords, batchName } = await req.json();

    if (!programId || !templateId || !validRecords || !Array.isArray(validRecords) || validRecords.length === 0) {
      return NextResponse.json(
        { error: "Program, template, and at least one valid candidate record are required." },
        { status: 400 }
      );
    }

    // Fetch program to get organizationId
    const program = await prisma.program.findUnique({
      where: { id: programId },
    });

    if (!program) {
      return NextResponse.json({ error: "Program not found." }, { status: 404 });
    }

    const orgId = session?.organizationId || program.organizationId;

    const batch = await prisma.certificateBatch.create({
      data: {
        organizationId: orgId,
        programId,
        templateId,
        createdById: session?.userId || null,
        batchName: batchName || `${program.name} Bulk Generation - ${new Date().toLocaleDateString()}`,
        totalCount: validRecords.length,
        processedCount: 0,
        successCount: 0,
        failedCount: 0,
        status: "QUEUED",
        itemsData: JSON.stringify(validRecords),
        startedAt: new Date(),
      },
    });

    await logAudit({
      organizationId: orgId,
      userId: session?.userId || null,
      action: "GENERATION_STARTED",
      entity: "CertificateBatch",
      entityId: batch.id,
      details: {
        batchName: batch.batchName,
        totalCandidates: validRecords.length,
        programName: program.name,
      },
    });

    return NextResponse.json({
      success: true,
      batchId: batch.id,
      totalCount: validRecords.length,
    });
  } catch (error: any) {
    console.error("Create batch error:", error);
    return NextResponse.json(
      { error: `Batch creation failed: ${error.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}
