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
    signatureUrl?: string | null;
    signatureX?: number | null;
    signatureY?: number | null;
    signatureWidth?: number | null;
    signatureAlignment?: "left" | "center" | "right" | string | null;
    signatoryTitle?: string | null;
    signatoryName?: string | null;
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
    SIGNATURE_URL?: string | null;
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
    let logoDrawn = false;
    try {
      const logoPath = path.join(process.cwd(), "public", "logo.png");
      if (fs.existsSync(logoPath)) {
        const logoBytes = fs.readFileSync(logoPath);
        const logoImage = await pdfDoc.embedPng(logoBytes);
        const logoWidth = 48;
        const logoHeight = 48;
        page.drawImage(logoImage, {
          x: (width - logoWidth) / 2,
          y: height - 85,
          width: logoWidth,
          height: logoHeight,
        });
        logoDrawn = true;
      }
    } catch {
      // Continue gracefully if image loading fails
    }

    const orgTitle = data.ORGANIZATION_NAME || "AISHWI TECHNOLOGIES";
    const titleWidth = fontHelveticaBold.widthOfTextAtSize(orgTitle, 15);
    page.drawText(orgTitle, {
      x: (width - titleWidth) / 2,
      y: logoDrawn ? height - 105 : height - 80,
      size: 15,
      font: fontHelveticaBold,
      color: rgb(0.12, 0.2, 0.35),
    });

    const certTitle = "CERTIFICATE OF COMPLETION";
    const certTitleWidth = fontTimesRomanBold.widthOfTextAtSize(certTitle, 26);
    page.drawText(certTitle, {
      x: (width - certTitleWidth) / 2,
      y: logoDrawn ? height - 138 : height - 120,
      size: 26,
      font: fontTimesRomanBold,
      color: rgb(0.08, 0.12, 0.28),
    });

    const subText = "THIS IS PROUDLY PRESENTED TO";
    const subTextWidth = fontHelvetica.widthOfTextAtSize(subText, 10.5);
    page.drawText(subText, {
      x: (width - subTextWidth) / 2,
      y: logoDrawn ? height - 162 : height - 150,
      size: 10.5,
      font: fontHelvetica,
      color: rgb(0.45, 0.5, 0.58),
    });
  }

  // Render each field
  for (const field of template.fields) {
    // Exclude college name from certificate
    const key = field.fieldKey.replace(/[{}]/g, "").toUpperCase();
    if (
      key === "COLLEGE_NAME" ||
      key === "COLLEGE_SUBTITLE" ||
      field.label?.toLowerCase().includes("college")
    ) {
      continue;
    }

    let textToRender = "";

    if (field.staticValue) {
      textToRender = field.staticValue
        .replace(/from\s+\{\{COLLEGE_NAME\}\}\s*(\(\{\{DEPARTMENT\}\}\))?/gi, "")
        .replace(/\{\{COLLEGE_NAME\}\}/gi, "")
        .trim();

      // Replace dynamic placeholders in static strings if present
      for (const [k, v] of Object.entries(data)) {
        if (v !== undefined && v !== null) {
          textToRender = textToRender.replace(new RegExp(`\\{\\{${k}\\}\\}`, "gi"), String(v));
        }
      }
    } else {
      // Resolve dynamic placeholder
      textToRender = data[key] !== undefined && data[key] !== null ? String(data[key]) : "";
    }

    if (!textToRender.trim()) continue;

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

  // Render Authorized Signature image if provided
  const sigSource =
    data.SIGNATURE_URL ||
    template.signatureUrl ||
    template.fields.find((f) => f.fieldKey === "SIGNATURE" && f.staticValue)?.staticValue;

  if (sigSource) {
    try {
      let sigImage: any = null;
      if (sigSource.startsWith("data:image/png;base64,")) {
        const b64 = sigSource.replace("data:image/png;base64,", "");
        sigImage = await pdfDoc.embedPng(Buffer.from(b64, "base64"));
      } else if (
        sigSource.startsWith("data:image/jpeg;base64,") ||
        sigSource.startsWith("data:image/jpg;base64,")
      ) {
        const b64 = sigSource.replace(/^data:image\/jpe?g;base64,/, "");
        sigImage = await pdfDoc.embedJpg(Buffer.from(b64, "base64"));
      } else if (fs.existsSync(sigSource)) {
        const imgBytes = fs.readFileSync(sigSource);
        sigImage = sigSource.endsWith(".png")
          ? await pdfDoc.embedPng(imgBytes)
          : await pdfDoc.embedJpg(imgBytes);
      }

      if (sigImage) {
        const sigField = template.fields.find(
          (f) => f.fieldKey === "SIGNATURE" || f.fieldKey === "SIGNATURE_IMAGE"
        );
        const targetWidth = template.signatureWidth || 115;
        const targetHeight = Math.min((sigImage.height / sigImage.width) * targetWidth, 60);

        const align = template.signatureAlignment || sigField?.alignment || "center";
        let baseCoordX =
          template.signatureX !== undefined && template.signatureX !== null
            ? template.signatureX
            : sigField
            ? sigField.x
            : width - targetWidth - 65;
        let sigY =
          template.signatureY !== undefined && template.signatureY !== null
            ? template.signatureY
            : sigField
            ? sigField.y
            : 85;

        let sigX = baseCoordX;
        if (align === "center") {
          sigX = baseCoordX - targetWidth / 2;
        } else if (align === "right") {
          sigX = baseCoordX - targetWidth;
        }

        page.drawImage(sigImage, {
          x: Math.max(10, sigX),
          y: Math.max(10, sigY),
          width: targetWidth,
          height: targetHeight,
        });

        // Decorative line & designation
        const sigTitle = template.signatoryTitle || "Authorized Signatory";
        const sigName = template.signatoryName || "";

        page.drawLine({
          start: { x: Math.max(10, sigX), y: sigY - 4 },
          end: { x: Math.max(10, sigX) + targetWidth, y: sigY - 4 },
          color: rgb(0.2, 0.25, 0.35),
          thickness: 1,
        });

        let textOffsetY = sigY - 14;
        if (sigName) {
          const nameWidth = fontHelveticaBold.widthOfTextAtSize(sigName, 9.5);
          let nameX = sigX;
          if (align === "center") nameX = sigX + (targetWidth - nameWidth) / 2;
          else if (align === "right") nameX = sigX + targetWidth - nameWidth;
          page.drawText(sigName, {
            x: Math.max(10, nameX),
            y: textOffsetY,
            size: 9.5,
            font: fontHelveticaBold,
            color: rgb(0.1, 0.15, 0.25),
          });
          textOffsetY -= 11;
        }

        if (sigTitle) {
          const titleWidth = fontHelvetica.widthOfTextAtSize(sigTitle, 8.5);
          let titleX = sigX;
          if (align === "center") titleX = sigX + (targetWidth - titleWidth) / 2;
          else if (align === "right") titleX = sigX + targetWidth - titleWidth;
          page.drawText(sigTitle, {
            x: Math.max(10, titleX),
            y: textOffsetY,
            size: 8.5,
            font: fontHelvetica,
            color: rgb(0.35, 0.4, 0.5),
          });
        }
      }
    } catch (sigErr) {
      console.warn("Signature embedding warning:", sigErr);
    }
  }

  return pdfDoc.save();
}
