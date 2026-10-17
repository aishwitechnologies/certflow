import { NextRequest, NextResponse } from "next/server";
import { generateErrorReportExcel, ValidationErrorItem } from "@/lib/excel-engine";

export async function POST(req: NextRequest) {
  try {
    const { errors } = (await req.json()) as { errors: ValidationErrorItem[] };

    if (!errors || !Array.isArray(errors) || errors.length === 0) {
      return NextResponse.json({ error: "No error records provided." }, { status: 400 });
    }

    const buffer = generateErrorReportExcel(errors);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="Certificate_Validation_Errors.xlsx"',
      },
    });
  } catch (error: any) {
    console.error("Error report generation failed:", error);
    return NextResponse.json({ error: "Failed to create error report." }, { status: 500 });
  }
}
