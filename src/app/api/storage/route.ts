import { NextRequest, NextResponse } from "next/server";
import { readFile } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const folder = searchParams.get("folder") || "certificates";
    const filename = searchParams.get("file");

    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 });
    }

    // Prevent directory traversal
    const safeFilename = filename.replace(/^(\.\.[\/\\])+/, "");
    const safeFolder = folder.replace(/^(\.\.[\/\\])+/, "");

    const fileBuffer = readFile(safeFolder, safeFilename);

    if (!fileBuffer) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const isPdf = safeFilename.endsWith(".pdf");
    const isZip = safeFilename.endsWith(".zip");
    const isInline = searchParams.get("inline") === "true";

    const contentType = isPdf
      ? "application/pdf"
      : isZip
      ? "application/zip"
      : "application/octet-stream";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `${isInline ? "inline" : "attachment"}; filename="${safeFilename}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("Storage fetch error:", error);
    return NextResponse.json({ error: "Failed to retrieve file" }, { status: 500 });
  }
}
