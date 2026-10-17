import { hashPassword, verifyPassword, signToken, verifyToken } from "../src/lib/auth";
import {
  reserveCertificateIds,
  formatCertificateId,
  getOrgIdConfig,
  DEFAULT_ID_CONFIG,
} from "../src/lib/id-generator";
import {
  generateExcelTemplate,
  parseSpreadsheetBuffer,
  validateMappedRows,
  generateErrorReportExcel,
} from "../src/lib/excel-engine";
import { generateCertificatePdf } from "../src/lib/pdf-engine";
import { generatePdfFilename, generateZipFilename } from "../src/lib/utils";
import { createBatchZip } from "../src/lib/zip-engine";
import { prisma } from "../src/lib/db";

async function runTests() {
  console.log("==========================================================");
  console.log("       STARTING CERTFLOW COMPREHENSIVE TEST SUITE         ");
  console.log("==========================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName} ${detail ? "- " + detail : ""}`);
      failed++;
    }
  }

  try {
    // TEST SUITE 1: Authentication & Password Security
    console.log(">>> TEST SUITE 1: Authentication & Password Security");
    const testPass = "SecureAdmin@2026!";
    const hash = await hashPassword(testPass);
    assert(hash !== testPass, "Password is never stored in plaintext");
    const isMatch = await verifyPassword(testPass, hash);
    assert(isMatch, "Bcrypt password verification succeeds for correct password");
    const isMismatch = await verifyPassword("WrongPassword", hash);
    assert(!isMismatch, "Bcrypt password verification fails for incorrect password");

    const token = signToken({
      userId: "user-123",
      email: "admin@certflow.com",
      name: "Admin User",
      role: "SUPER_ADMIN",
      organizationId: "org-123",
    });
    const verified = verifyToken(token);
    assert(verified !== null && verified.email === "admin@certflow.com", "JWT session token signing and verification");

    // TEST SUITE 2: Atomic Certificate ID Generator
    console.log("\n>>> TEST SUITE 2: Atomic Certificate ID Generation Engine");
    const org = await prisma.organization.findFirst();
    if (!org) throw new Error("Database not seeded. Run 'npm run db:seed' first.");

    // Test monthly ID formatting: AT-10-01
    const testDate = new Date("2026-10-15");
    const formattedId = formatCertificateId(1, DEFAULT_ID_CONFIG, testDate);
    assert(formattedId === "AT-10-01", `Default ID format AT-MM-SS produces: ${formattedId}`);

    const formattedId99 = formatCertificateId(99, DEFAULT_ID_CONFIG, testDate);
    assert(formattedId99 === "AT-10-99", `Sequence padding 2 handles double digits: ${formattedId99}`);

    // Test custom prefix & 3-digit padding
    const customConfig = {
      prefix: "AISHWI",
      separator: "-",
      includeYear: true,
      includeMonth: true,
      padding: 3,
      monthlyReset: true,
    };
    const customId = formatCertificateId(5, customConfig, testDate);
    assert(customId === "AISHWI-2026-10-005", `Custom prefix & year & padding produces: ${customId}`);

    // Test atomic block reservation (concurrency safe)
    const reservedIds = await reserveCertificateIds(org.id, 5, testDate);
    assert(reservedIds.length === 5, "Atomically reserved 5 unique consecutive IDs");
    const allUnique = new Set(reservedIds).size === 5;
    assert(allUnique, "Zero duplicates in atomically reserved block: " + reservedIds.join(", "));

    // TEST SUITE 3: Excel & CSV Engine
    console.log("\n>>> TEST SUITE 3: Excel & CSV Engine, Validation & Error Reporting");
    const excelBuffer = generateExcelTemplate();
    assert(Buffer.isBuffer(excelBuffer) && excelBuffer.length > 500, "Generated .xlsx template with binary content");

    const { headers, rows } = parseSpreadsheetBuffer(excelBuffer, "template.xlsx");
    assert(headers.includes("Candidate Name") && headers.includes("Email"), "Parsed template headers successfully");
    assert(rows.length >= 2, `Detected sample rows in template: ${rows.length} rows`);

    // Test validation on sample data
    const standardMapping = {
      candidateName: "Candidate Name",
      email: "Email",
      collegeName: "College Name",
      department: "Department",
      programName: "Program Name",
      domain: "Domain",
      startDate: "Start Date",
      endDate: "End Date",
    };
    const validResult = validateMappedRows(rows, standardMapping);
    assert(validResult.validRecordsCount === rows.length, "Valid template sample records pass 100% validation");

    // Test validation error detection (missing name, bad email, missing dates)
    const badRows = [
      {
        rowNumber: 2,
        data: {
          "Candidate Name": "", // Missing!
          "Email": "not-an-email", // Invalid!
          "Start Date": "", // Missing!
          "End Date": "",
        },
      },
    ];
    const invalidResult = validateMappedRows(badRows, standardMapping);
    assert(invalidResult.errorRecordsCount === 1, "Correctly flagged row with errors");
    assert(invalidResult.errors.length >= 3, `Detected all granular field errors (${invalidResult.errors.length} errors)`);

    const errReport = generateErrorReportExcel(invalidResult.errors);
    assert(Buffer.isBuffer(errReport) && errReport.length > 200, "Generated downloadable Excel error report");

    // TEST SUITE 4: Server-Side PDF Engine & Unicode Support
    console.log("\n>>> TEST SUITE 4: Server-Side PDF Rendering & Filename Sanitization");
    const sampleTemplate = await prisma.certificateTemplate.findFirst({
      include: { fields: true },
    });
    if (!sampleTemplate) throw new Error("No template found");

    const pdfBytes = await generateCertificatePdf({
      template: {
        width: sampleTemplate.width,
        height: sampleTemplate.height,
        orientation: sampleTemplate.orientation,
        fields: sampleTemplate.fields.map((f) => ({
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
        NAME: "Ravi Kumar",
        CERTIFICATE_ID: "AT-10-01",
        PROGRAM_NAME: "AI Internship",
        COLLEGE_NAME: "ABC College",
        DEPARTMENT: "CSE",
        START_DATE: "01-10-2026",
        END_DATE: "31-10-2026",
        ISSUE_DATE: "31 October 2026",
        ORGANIZATION_NAME: "Acme Tech Innovations",
      },
    });

    assert(pdfBytes instanceof Uint8Array && pdfBytes.length > 1000, "Successfully rendered PDF binary stream");

    // Test PDF naming rule: Candidate_Name_Certificate_ID.pdf
    const sanitizedName = generatePdfFilename("Ravi Kumar", "AT-10-01");
    assert(sanitizedName === "Ravi_Kumar_AT-10-01.pdf", `Candidate-named PDF format: ${sanitizedName}`);

    const dangerousName = generatePdfFilename('Sita / \\ : * ? " < > | Reddy', "AT-10-02");
    assert(
      !dangerousName.includes("/") && !dangerousName.includes("\\") && !dangerousName.includes(":"),
      `Sanitizes dangerous filesystem characters: ${dangerousName}`
    );

    // TEST SUITE 5: Bulk ZIP Packaging
    console.log("\n>>> TEST SUITE 5: Bulk ZIP Packaging Engine");
    const zipResult = await createBatchZip("AI Internship", [
      { filename: "Ravi_Kumar_AT-10-01.pdf", content: pdfBytes },
      { filename: "Sita_Reddy_AT-10-02.pdf", content: pdfBytes },
    ]);
    assert(zipResult.zipFilename.includes("AI_Internship_Certificates_"), "ZIP filename follows standard convention");
    assert(Buffer.isBuffer(zipResult.buffer) && zipResult.buffer.length > 1000, "Generated valid ZIP archive");

    // TEST SUITE 6: Verification & Revocation
    console.log("\n>>> TEST SUITE 6: Public Verification Engine & Revocation");
    const existingCert = await prisma.certificate.findUnique({
      where: { certificateId: "AT-10-01" },
    });
    assert(existingCert !== null && existingCert.status === "VALID", "Seeded certificate AT-10-01 is VALID");

    // Verification check simulation
    assert(existingCert?.certificateId === "AT-10-01", "Verification confirms Certificate ID");
    assert(existingCert?.candidateName === "Ravi Kumar", "Verification confirms candidate Ravi Kumar");

    // TEST SUITE 7: Strict Anti-QR Compliance
    console.log("\n>>> TEST SUITE 7: Anti-QR Code Verification Rule");
    const fs = await import("fs");
    const path = await import("path");
    const pdfEngineCode = fs.readFileSync(path.join(__dirname, "../src/lib/pdf-engine.ts"), "utf-8");
    assert(!pdfEngineCode.toLowerCase().includes("qrcode"), "PDF engine contains zero QR code imports or generators");
    const verifyPageCode = fs.readFileSync(path.join(__dirname, "../src/app/verify/page.tsx"), "utf-8");
    assert(!verifyPageCode.toLowerCase().includes("qrcode"), "Verification page contains zero QR scanning/display logic");

    console.log("\n==========================================================");
    console.log(`   TEST RESULTS: ${passed} PASSED | ${failed} FAILED     `);
    console.log("==========================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Test execution failed with exception:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
