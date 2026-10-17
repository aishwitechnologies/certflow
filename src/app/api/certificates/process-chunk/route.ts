import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { reserveCertificateIds } from "@/lib/id-generator";
import { generateCertificatePdf } from "@/lib/pdf-engine";
import { generatePdfFilename } from "@/lib/utils";
import { saveFile } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const { batchId, startIndex, chunkSize = 25 } = await req.json();

    if (!batchId) {
      return NextResponse.json({ error: "Batch ID is required." }, { status: 400 });
    }

    const batch = await prisma.certificateBatch.findUnique({
      where: { id: batchId },
      include: {
        program: true,
        template: {
          include: { fields: true },
        },
      },
    });

    if (!batch) {
      return NextResponse.json({ error: "Batch not found." }, { status: 404 });
    }

    const allRecords: any[] = JSON.parse(batch.itemsData || "[]");
    const totalCount = allRecords.length;
    const fromIndex = typeof startIndex === "number" ? startIndex : batch.processedCount;
    const chunkRecords = allRecords.slice(fromIndex, fromIndex + chunkSize);

    if (chunkRecords.length === 0) {
      return NextResponse.json({
        success: true,
        batchId,
        processedCount: batch.processedCount,
        totalCount,
        isFinished: true,
      });
    }

    // 1. Atomically reserve Certificate IDs for this chunk
    const generationDate = new Date();
    const certificateIds = await reserveCertificateIds(
      batch.organizationId,
      chunkRecords.length,
      generationDate
    );

    const processedItems: Array<{ certificateId: string; candidateName: string; pdfUrl: string }> = [];

    // 2. Process each candidate in chunk
    for (let i = 0; i < chunkRecords.length; i++) {
      const rec = chunkRecords[i];
      const certId = certificateIds[i];

      try {
        // Upsert candidate
        const candidate = await prisma.candidate.upsert({
          where: {
            organizationId_email_programId: {
              organizationId: batch.organizationId,
              email: rec.email.toLowerCase().trim(),
              programId: batch.programId,
            },
          },
          update: {
            name: rec.candidateName,
            college: rec.collegeName || null,
            department: rec.department || null,
            domain: rec.domain || null,
          },
          create: {
            organizationId: batch.organizationId,
            name: rec.candidateName,
            email: rec.email.toLowerCase().trim(),
            college: rec.collegeName || null,
            department: rec.department || null,
            programId: batch.programId,
            domain: rec.domain || null,
          },
        });

        // Format dates
        const issueDateStr = generationDate.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });

        // Generate PDF
        const pdfBytes = await generateCertificatePdf({
          template: {
            width: batch.template.width,
            height: batch.template.height,
            orientation: batch.template.orientation,
            backgroundUrl: batch.template.backgroundUrl,
            fields: batch.template.fields.map((f) => ({
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
            NAME: rec.candidateName,
            CERTIFICATE_ID: certId,
            PROGRAM_NAME: rec.programName || batch.program.name,
            DOMAIN: rec.domain || "",
            COLLEGE_NAME: rec.collegeName || "",
            DEPARTMENT: rec.department || "",
            START_DATE: rec.startDate || "",
            END_DATE: rec.endDate || "",
            ISSUE_DATE: issueDateStr,
            ORGANIZATION_NAME: "Acme Tech Innovations",
          },
        });

        // Generate candidate-named PDF filename: Candidate_Name_Certificate_ID.pdf
        const pdfFilename = generatePdfFilename(rec.candidateName, certId);
        const pdfStorageUrl = await saveFile("certificates", pdfFilename, pdfBytes);

        // Save Certificate Record
        const cert = await prisma.certificate.create({
          data: {
            certificateId: certId,
            organizationId: batch.organizationId,
            candidateId: candidate.id,
            programId: batch.programId,
            templateId: batch.templateId,
            batchId: batch.id,
            candidateName: rec.candidateName,
            collegeName: rec.collegeName || null,
            department: rec.department || null,
            domain: rec.domain || null,
            issueDate: generationDate,
            status: "VALID",
            pdfPath: pdfStorageUrl,
            verificationUrl: `/verify/${certId}`,
          },
        });

        // Record Certificate Event
        await prisma.certificateEvent.create({
          data: {
            certificateId: cert.id,
            eventType: "GENERATED",
            actor: batch.createdById || "SYSTEM",
            details: JSON.stringify({ batchId: batch.id, filename: pdfFilename }),
          },
        });

        processedItems.push({
          certificateId: certId,
          candidateName: rec.candidateName,
          pdfUrl: pdfStorageUrl,
        });
      } catch (err: any) {
        console.error(`Failed to generate certificate for ${rec.candidateName}:`, err);
      }
    }

    const newProcessedCount = fromIndex + chunkRecords.length;
    const isFinished = newProcessedCount >= totalCount;

    // Update batch progress
    await prisma.certificateBatch.update({
      where: { id: batch.id },
      data: {
        processedCount: newProcessedCount,
        successCount: { increment: processedItems.length },
        status: isFinished ? "PROCESSING_FINAL" : "PROCESSING",
      },
    });

    return NextResponse.json({
      success: true,
      batchId,
      processedCount: newProcessedCount,
      totalCount,
      chunkItemsProcessed: processedItems.length,
      isFinished,
      processedItems,
    });
  } catch (error: any) {
    console.error("Process chunk error:", error);
    return NextResponse.json(
      { error: `Chunk processing failed: ${error.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}
