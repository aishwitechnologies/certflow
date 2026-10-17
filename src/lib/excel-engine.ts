import * as XLSX from "xlsx";
import Papa from "papaparse";

export interface CandidateRawRow {
  rowNumber: number;
  data: Record<string, any>;
}

export interface ValidationErrorItem {
  rowNumber: number;
  field: string;
  error: string;
  suggestedCorrection: string;
}

export interface ValidationResult {
  totalRecords: number;
  validRecordsCount: number;
  errorRecordsCount: number;
  validRecords: Array<{
    rowNumber: number;
    candidateName: string;
    email: string;
    collegeName?: string;
    department?: string;
    programName?: string;
    domain?: string;
    startDate?: string;
    endDate?: string;
    customFields?: Record<string, any>;
  }>;
  errors: ValidationErrorItem[];
  sampleRecords: Record<string, any>[];
  headers: string[];
}

/**
 * Standard field keys mapped in certificate generation
 */
export const STANDARD_FIELDS = [
  { key: "candidateName", label: "Candidate Name", placeholder: "{{NAME}}", required: true },
  { key: "email", label: "Email", placeholder: "{{EMAIL}}", required: true },
  { key: "collegeName", label: "College Name", placeholder: "{{COLLEGE_NAME}}", required: false },
  { key: "department", label: "Department", placeholder: "{{DEPARTMENT}}", required: false },
  { key: "programName", label: "Program Name", placeholder: "{{PROGRAM_NAME}}", required: false },
  { key: "domain", label: "Domain", placeholder: "{{DOMAIN}}", required: false },
  { key: "startDate", label: "Start Date", placeholder: "{{START_DATE}}", required: true },
  { key: "endDate", label: "End Date", placeholder: "{{END_DATE}}", required: true },
];

/**
 * Generate Excel Template with "Candidates" and "Instructions" sheets
 */
export function generateExcelTemplate(): Buffer {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Candidates
  const sampleData = [
    {
      "Candidate Name": "Ravi Kumar",
      "Email": "ravi@email.com",
      "College Name": "ABC College of Engineering",
      "Department": "Computer Science & Engineering",
      "Program Name": "AI Internship",
      "Domain": "Artificial Intelligence",
      "Start Date": "01-10-2026",
      "End Date": "31-10-2026",
    },
    {
      "Candidate Name": "Sita Reddy",
      "Email": "sita@email.com",
      "College Name": "XYZ Institute of Technology",
      "Department": "Information Technology",
      "Program Name": "AI Internship",
      "Domain": "Artificial Intelligence",
      "Start Date": "01-10-2026",
      "End Date": "31-10-2026",
    },
  ];

  const wsCandidates = XLSX.utils.json_to_sheet(sampleData, {
    header: [
      "Candidate Name",
      "Email",
      "College Name",
      "Department",
      "Program Name",
      "Domain",
      "Start Date",
      "End Date",
    ],
  });

  // Adjust column widths
  wsCandidates["!cols"] = [
    { wch: 22 }, // Candidate Name
    { wch: 24 }, // Email
    { wch: 30 }, // College Name
    { wch: 25 }, // Department
    { wch: 20 }, // Program Name
    { wch: 24 }, // Domain
    { wch: 14 }, // Start Date
    { wch: 14 }, // End Date
  ];

  XLSX.utils.book_append_sheet(wb, wsCandidates, "Candidates");

  // Sheet 2: Instructions
  const instructions = [
    { Instruction: "Rule 1", Details: "Enter one candidate per row." },
    { Instruction: "Rule 2", Details: "Do not leave required fields blank (Candidate Name, Email, Start Date, End Date)." },
    { Instruction: "Rule 3", Details: "Use standard date format: DD-MM-YYYY or YYYY-MM-DD (e.g., 01-10-2026)." },
    { Instruction: "Rule 4", Details: "Do not merge cells or leave blank rows between entries." },
    { Instruction: "Rule 5", Details: "Do not modify the file structure or column headers unnecessarily." },
    { Instruction: "Rule 6", Details: "Save the file as .xlsx or .csv format." },
    { Instruction: "Rule 7", Details: "Upload the completed file to the platform to start generation." },
  ];

  const wsInstructions = XLSX.utils.json_to_sheet(instructions);
  wsInstructions["!cols"] = [{ wch: 16 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, "Instructions");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

/**
 * Parse an uploaded buffer (XLSX, XLS, or CSV)
 */
export function parseSpreadsheetBuffer(
  buffer: Buffer,
  filename: string
): { headers: string[]; rows: CandidateRawRow[] } {
  const isCsv = filename.toLowerCase().endsWith(".csv");

  if (isCsv) {
    const csvText = buffer.toString("utf-8");
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: "greedy",
    });

    const headers = (parsed.meta.fields || []).map((h) => h.trim());
    const rows: CandidateRawRow[] = (parsed.data as Record<string, any>[]).map((item, index) => ({
      rowNumber: index + 2, // 1 is header
      data: item,
    }));

    return { headers, rows };
  }

  // Handle Excel (.xlsx, .xls)
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const rawJson: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
    defval: "",
    raw: false,
  });

  if (rawJson.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = Object.keys(rawJson[0]).map((h) => h.trim());
  const rows: CandidateRawRow[] = rawJson.map((item, index) => ({
    rowNumber: index + 2,
    data: item,
  }));

  return { headers, rows };
}

/**
 * Validate parsed rows against mapped fields
 */
export function validateMappedRows(
  rows: CandidateRawRow[],
  mapping: Record<string, string> // e.g. { candidateName: "Candidate Name", email: "Email", ... }
): ValidationResult {
  const errors: ValidationErrorItem[] = [];
  const validRecords: ValidationResult["validRecords"] = [];
  const seenEmails = new Set<string>();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  rows.forEach(({ rowNumber, data }) => {
    // Check if entire row is empty
    const values = Object.values(data).map((v) => String(v).trim());
    const isCompletelyEmpty = values.every((v) => v === "");
    if (isCompletelyEmpty) {
      return; // gracefully skip empty row
    }

    const rowErrors: ValidationErrorItem[] = [];

    // Extract mapped fields
    const getVal = (fieldKey: string): string => {
      const colHeader = mapping[fieldKey];
      if (!colHeader) return "";
      const val = data[colHeader];
      return val !== undefined && val !== null ? String(val).trim() : "";
    };

    const candidateName = getVal("candidateName");
    const email = getVal("email");
    const collegeName = getVal("collegeName");
    const department = getVal("department");
    const programName = getVal("programName");
    const domain = getVal("domain");
    const startDate = getVal("startDate");
    const endDate = getVal("endDate");

    // 1. Candidate Name check
    if (!candidateName) {
      rowErrors.push({
        rowNumber,
        field: "Candidate Name",
        error: "Candidate Name is missing or empty.",
        suggestedCorrection: "Enter the candidate's full legal name.",
      });
    }

    // 2. Email check
    if (!email) {
      rowErrors.push({
        rowNumber,
        field: "Email",
        error: "Email address is missing.",
        suggestedCorrection: "Provide a valid email address (e.g., student@email.com).",
      });
    } else if (!emailRegex.test(email)) {
      rowErrors.push({
        rowNumber,
        field: "Email",
        error: `Invalid email address format: "${email}".`,
        suggestedCorrection: "Ensure the email matches format: username@domain.com.",
      });
    } else {
      if (seenEmails.has(email.toLowerCase())) {
        rowErrors.push({
          rowNumber,
          field: "Email",
          error: `Duplicate candidate email detected in row: "${email}".`,
          suggestedCorrection: "Verify whether this is a duplicate entry or use a unique email.",
        });
      } else {
        seenEmails.add(email.toLowerCase());
      }
    }

    // 3. Start Date check
    if (!startDate) {
      rowErrors.push({
        rowNumber,
        field: "Start Date",
        error: "Start Date is missing.",
        suggestedCorrection: "Provide a start date (e.g. 01-10-2026).",
      });
    }

    // 4. End Date check
    if (!endDate) {
      rowErrors.push({
        rowNumber,
        field: "End Date",
        error: "End Date is missing.",
        suggestedCorrection: "Provide an end date (e.g. 31-10-2026).",
      });
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else {
      validRecords.push({
        rowNumber,
        candidateName,
        email,
        collegeName,
        department,
        programName,
        domain,
        startDate,
        endDate,
        customFields: data,
      });
    }
  });

  const totalRecords = rows.length;
  const sampleRecords = rows.slice(0, 3).map((r) => r.data);

  return {
    totalRecords,
    validRecordsCount: validRecords.length,
    errorRecordsCount: totalRecords - validRecords.length,
    validRecords,
    errors,
    sampleRecords,
    headers: rows.length > 0 ? Object.keys(rows[0].data) : [],
  };
}

/**
 * Generate an Excel file containing all validation errors
 */
export function generateErrorReportExcel(errors: ValidationErrorItem[]): Buffer {
  const wb = XLSX.utils.book_new();
  const data = errors.map((e) => ({
    "Row Number": e.rowNumber,
    "Field": e.field,
    "Error Description": e.error,
    "Suggested Correction": e.suggestedCorrection,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [{ wch: 12 }, { wch: 18 }, { wch: 45 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, ws, "Validation_Errors");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}
