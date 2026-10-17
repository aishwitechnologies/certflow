import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs";
import path from "path";

export interface CertificateFieldData {
  fieldKey: string;
  label?: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  color: string;
  alignment: "left" | "center" | "right";
  maxWidth?: number | null;
  staticValue?: string | null;
}

export interface RenderCertificateParams {
  template: {
    width: number;
    height: number;
    orientation: string;
    backgroundUrl?: string | null;
    fields: CertificateFieldData[];
  };
  data: {
    NAME: string;
    CERTIFICATE_ID: string;
    PROGRAM_NAME: string;
    DOMAIN?: string;
    START_DATE?: string;
    END_DATE?: string;
    ISSUE_DATE?: string;
    ORGANIZATION_NAME?: string;
    DURATION?: string;
    COLLEGE_NAME?: string;
    DEPARTMENT?: string;
    [key: string]: any;
  };
}

/**
 * Parse hex color (e.g., "#4F46E5" or "#111827") to pdf-lib rgb values
 */
function hexToRgb(hex: string) {
  const cleanHex = hex.replace("#", "");
  const num = parseInt(cleanHex, 16);
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;
  return rgb(r, g, b);
}

/**
 * Draw an elegant vector certificate frame if no background image is supplied
 */
function drawCertificateFrame(page: PDFPage, width: number, height: number) {
  // Deep Navy background border
  const navy = rgb(0.08, 0.12, 0.28);
  const gold = rgb(0.85, 0.68, 0.28);
  const lightBg = rgb(0.99, 0.99, 1.0);

  // Outer canvas fill
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: lightBg,
  });

  // Outer primary border
  page.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    borderColor: navy,
    borderWidth: 4,
  });

  // Inner gold decorative border
  page.drawRectangle({
    x: 26,
    y: 26,
    width: width - 52,
    height: height - 52,
    borderColor: gold,
    borderWidth: 1.5,
  });

  // Corner decorative accents
  const cornerSize = 25;
  // Bottom-left
  page.drawLine({
    start: { x: 26, y: 26 + cornerSize },
    end: { x: 26 + cornerSize, y: 26 },
    color: gold,
    thickness: 2,
  });
  // Top-left
  page.drawLine({
    start: { x: 26, y: height - 26 - cornerSize },
    end: { x: 26 + cornerSize, y: height - 26 },
    color: gold,
    thickness: 2,
  });
  // Bottom-right
  page.drawLine({
    start: { x: width - 26 - cornerSize, y: 26 },
    end: { x: width - 26, y: 26 + cornerSize },
    color: gold,
    thickness: 2,
  });
  // Top-right
  page.drawLine({
    start: { x: width - 26 - cornerSize, y: height - 26 },
    end: { x: width - 26, y: height - 26 - cornerSize },
    color: gold,
    thickness: 2,
  });
}

/**
 * Core PDF Generation Engine
 */
export async function generateCertificatePdf(params: RenderCertificateParams): Promise<Uint8Array> {
  const { template, data } = params;
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const width = template.width || 841.89; // Standard A4 Landscape
  const height = template.height || 595.28;

  const page = pdfDoc.addPage([width, height]);

  // Embed standard fonts
  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontTimesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontTimesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  // If a custom background image is provided (data URI, base64, or file path)
  if (template.backgroundUrl) {
    try {
      if (template.backgroundUrl.startsWith("data:image/png;base64,")) {
        const base64Data = template.backgroundUrl.replace("data:image/png;base64,", "");
        const imageBytes = Buffer.from(base64Data, "base64");
        const image = await pdfDoc.embedPng(imageBytes);
        page.drawImage(image, { x: 0, y: 0, width, height });
      } else if (template.backgroundUrl.startsWith("data:image/jpeg;base64,")) {
        const base64Data = template.backgroundUrl.replace("data:image/jpeg;base64,", "");
        const imageBytes = Buffer.from(base64Data, "base64");
        const image = await pdfDoc.embedJpg(imageBytes);
        page.drawImage(image, { x: 0, y: 0, width, height });
      } else if (fs.existsSync(template.backgroundUrl)) {
        const imageBytes = fs.readFileSync(template.backgroundUrl);
        const image = template.backgroundUrl.endsWith(".png")
          ? await pdfDoc.embedPng(imageBytes)
          : await pdfDoc.embedJpg(imageBytes);
        page.drawImage(image, { x: 0, y: 0, width, height });
      } else {
        // Fallback to elegant vector certificate frame
        drawCertificateFrame(page, width, height);
      }
    } catch {
      drawCertificateFrame(page, width, height);
    }
  } else {
    drawCertificateFrame(page, width, height);
  }

  // Draw Header / Title defaults if no custom template fields specify title
  const hasTitleField = template.fields.some((f) => f.fieldKey === "TITLE");
  if (!hasTitleField) {
    const orgTitle = data.ORGANIZATION_NAME || "EXCELLENCE IN TECHNOLOGY";
    const titleWidth = fontHelveticaBold.widthOfTextAtSize(orgTitle, 16);
    page.drawText(orgTitle, {
      x: (width - titleWidth) / 2,
      y: height - 80,
      size: 16,
      font: fontHelveticaBold,
      color: rgb(0.2, 0.25, 0.35),
    });

    const certTitle = "CERTIFICATE OF COMPLETION";
    const certTitleWidth = fontTimesRomanBold.widthOfTextAtSize(certTitle, 28);
    page.drawText(certTitle, {
      x: (width - certTitleWidth) / 2,
      y: height - 120,
      size: 28,
      font: fontTimesRomanBold,
      color: rgb(0.08, 0.12, 0.28),
    });

    const subText = "THIS IS PROUDLY PRESENTED TO";
    const subTextWidth = fontHelvetica.widthOfTextAtSize(subText, 11);
    page.drawText(subText, {
      x: (width - subTextWidth) / 2,
      y: height - 150,
      size: 11,
      font: fontHelvetica,
      color: rgb(0.5, 0.55, 0.6),
    });
  }

  // Render each field
  for (const field of template.fields) {
    let textToRender = "";

    if (field.staticValue) {
      textToRender = field.staticValue;
    } else {
      // Resolve dynamic placeholder
      const key = field.fieldKey.replace(/[{}]/g, "").toUpperCase();
      textToRender = data[key] !== undefined && data[key] !== null ? String(data[key]) : "";
    }

    if (!textToRender) continue;

    // Pick font
    let font: PDFFont = fontHelvetica;
    if (field.fontFamily?.toLowerCase().includes("times")) {
      font = field.fontWeight === "bold" ? fontTimesRomanBold : fontTimesRoman;
    } else {
      font = field.fontWeight === "bold" ? fontHelveticaBold : fontHelvetica;
    }

    const fontSize = field.fontSize || 14;
    const textColor = hexToRgb(field.color || "#111827");
    const textWidth = font.widthOfTextAtSize(textToRender, fontSize);

    let xPos = field.x;
    if (field.alignment === "center") {
      xPos = field.x - textWidth / 2;
    } else if (field.alignment === "right") {
      xPos = field.x - textWidth;
    }

    // Guard within boundaries
    if (xPos < 20) xPos = 20;

    page.drawText(textToRender, {
      x: xPos,
      y: field.y,
      size: fontSize,
      font,
      color: textColor,
    });
  }

  // Always ensure Certificate ID is printed visibly at bottom-left if not explicitly positioned
  const hasIdField = template.fields.some((f) => f.fieldKey.includes("CERTIFICATE_ID"));
  if (!hasIdField && data.CERTIFICATE_ID) {
    const idText = `Certificate ID: ${data.CERTIFICATE_ID}`;
    page.drawText(idText, {
      x: 50,
      y: 45,
      size: 10,
      font: fontHelveticaBold,
      color: rgb(0.3, 0.35, 0.45),
    });
  }

  // Draw Issue date and verification note at bottom
  const verifyNote = `Verify at: /verify/${data.CERTIFICATE_ID}`;
  const verifyNoteWidth = fontHelvetica.widthOfTextAtSize(verifyNote, 9);
  page.drawText(verifyNote, {
    x: width - verifyNoteWidth - 50,
    y: 45,
    size: 9,
    font: fontHelvetica,
    color: rgb(0.4, 0.45, 0.55),
  });

  return pdfDoc.save();
}
