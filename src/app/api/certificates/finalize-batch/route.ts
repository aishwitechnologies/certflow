import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createBatchZip, ZipFileEntry } from "@/lib/zip-engine";
import { readFile } from "@/lib/storage";
import { generatePdfFilename } from "@/lib/utils";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const { batchId } = await req.json();

    if (!batchId) {
      return NextResponse.json({ error: "Batch ID is required." }, { status: 400 });
    }

    const batch = await prisma.certificateBatch.findUnique({
      where: { id: batchId },
      include: {
        program: true,
        certificates: true,
      },
    });

    if (!batch) {
      return NextResponse.json({ error: "Batch not found." }, { status: 404 });
    }

    // Collect all certificate PDF files
    const zipEntries: ZipFileEntry[] = [];

    for (const cert of batch.certificates) {
      const filename = generatePdfFilename(cert.candidateName, cert.certificateId);
      const pdfBytes = readFile("certificates", filename);
      if (pdfBytes) {
        zipEntries.push({
          filename,
          content: pdfBytes,
        });
      }
    }

    const { zipFilename, storageUrl } = await createBatchZip(batch.program.name, zipEntries);

    await prisma.certificateBatch.update({
      where: { id: batch.id },
      data: {
        zipPath: storageUrl,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    await logAudit({
      organizationId: batch.organizationId,
      userId: batch.createdById,
      action: "GENERATION_COMPLETED",
      entity: "CertificateBatch",
      entityId: batch.id,
      details: {
        batchName: batch.batchName,
        totalGenerated: zipEntries.length,
        zipFilename,
      },
    });

    return NextResponse.json({
      success: true,
      batchId: batch.id,
      zipFilename,
      downloadUrl: storageUrl,
      totalPdfsInZip: zipEntries.length,
    });
  } catch (error: any) {
    console.error("Finalize batch error:", error);
    return NextResponse.json(
      { error: `Finalizing batch failed: ${error.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}
