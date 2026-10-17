import { NextRequest, NextResponse } from "next/server";
import { parseSpreadsheetBuffer, validateMappedRows } from "@/lib/excel-engine";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const mappingStr = formData.get("mapping") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    // Validate extension
    const filename = file.name;
    const validExtensions = [".xlsx", ".xls", ".csv"];
    const hasValidExt = validExtensions.some((ext) => filename.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload an .xlsx, .xls, or .csv file." },
        { status: 400 }
      );
    }

    // Validate size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File exceeds maximum permitted size of 20MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { headers, rows } = parseSpreadsheetBuffer(buffer, filename);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "The uploaded file does not contain any data rows." },
        { status: 400 }
      );
    }

    // Default auto-mapping heuristics if no custom mapping provided
    let mapping: Record<string, string> = {};
    if (mappingStr) {
      try {
        mapping = JSON.parse(mappingStr);
      } catch {
        mapping = {};
      }
    }

    // Auto-detect matching headers if unmapped
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const standardKeys = [
      { key: "candidateName", aliases: ["candidatename", "name", "studentname", "fullname"] },
      { key: "email", aliases: ["email", "emailaddress", "candidateemail"] },
      { key: "collegeName", aliases: ["collegename", "college", "institution", "university"] },
      { key: "department", aliases: ["department", "dept", "branch", "stream"] },
      { key: "programName", aliases: ["programname", "program", "course", "internship"] },
      { key: "domain", aliases: ["domain", "track", "specialization", "area"] },
      { key: "startDate", aliases: ["startdate", "fromdate", "start", "from"] },
      { key: "endDate", aliases: ["enddate", "todate", "end", "to"] },
    ];

    for (const item of standardKeys) {
      if (!mapping[item.key]) {
        const found = headers.find((h) => item.aliases.includes(normalize(h)));
        if (found) {
          mapping[item.key] = found;
        }
      }
    }

    const validationResult = validateMappedRows(rows, mapping);

    return NextResponse.json({
      success: true,
      mapping,
      ...validationResult,
    });
  } catch (error: any) {
    console.error("Spreadsheet validation error:", error);
    return NextResponse.json(
      { error: `File processing failed: ${error.message || "Invalid or corrupt spreadsheet file."}` },
      { status: 400 }
    );
  }
}
