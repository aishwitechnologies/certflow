import { NextResponse } from "next/server";
import { generateExcelTemplate } from "@/lib/excel-engine";

export async function GET() {
  try {
    const buffer = generateExcelTemplate();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="Certificate_Candidates_Template.xlsx"',
      },
    });
  } catch (error: any) {
    console.error("Excel template error:", error);
    return NextResponse.json(
      { error: "Failed to generate Excel template." },
      { status: 500 }
    );
  }
}
