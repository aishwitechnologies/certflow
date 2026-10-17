import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sheetUrl, sheetId, apiKey } = await req.json();

    let targetSpreadsheetId = sheetId;
    if (sheetUrl && !targetSpreadsheetId) {
      // Extract from URL: https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit...
      const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        targetSpreadsheetId = match[1];
      }
    }

    if (!targetSpreadsheetId) {
      return NextResponse.json(
        { error: "Invalid Google Sheets URL or Spreadsheet ID." },
        { status: 400 }
      );
    }

    // Attempt to fetch public CSV export or use Google Sheets API
    // Public sheets can be read via /export?format=csv
    const exportUrl = `https://docs.google.com/spreadsheets/d/${targetSpreadsheetId}/export?format=csv`;

    const response = await fetch(exportUrl, {
      headers: {
        "User-Agent": "Aishwi-Technologies-Automation/1.0",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            "Could not access Google Sheet. Please ensure the Google Sheet is shared with 'Anyone with the link can view' or configure Google OAuth credentials in Settings.",
        },
        { status: 400 }
      );
    }

    const csvText = await response.text();

    return NextResponse.json({
      success: true,
      spreadsheetId: targetSpreadsheetId,
      csvData: csvText,
      message: "Google Sheet successfully connected and loaded.",
    });
  } catch (error: any) {
    console.error("Google Sheets connect error:", error);
    return NextResponse.json(
      { error: `Google Sheets connection failed: ${error.message}` },
      { status: 500 }
    );
  }
}
