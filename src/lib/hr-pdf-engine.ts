import { PDFDocument, rgb, StandardFonts, PDFPage } from "pdf-lib";
import fs from "fs";
import path from "path";

export interface HrDocumentRenderParams {
  documentId: string;
  documentType: "OFFER_LETTER" | "COMPLETION_LETTER" | "EXPERIENCE_LETTER" | "RELIEVING_LETTER" | "LOR" | string;
  candidateName: string;
  candidateEmail?: string | null;
  candidatePhone?: string | null;
  collegeName?: string | null;
  department?: string | null;
  roleTitle: string;
  departmentName?: string | null;
  stipend?: string | null;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  issueDate?: string | Date | null;
  signatoryName?: string | null;
  signatoryTitle?: string | null;
  signatureUrl?: string | null;
  contentOverride?: string | null;
  templateUrl?: string | null;
  letterheadMode?: "STANDARD" | "CUSTOM" | string;
  topMargin?: number | null;
  bottomMargin?: number | null;
  leftMargin?: number | null;
  rightMargin?: number | null;
  hideDefaultHeaderFooter?: boolean | null;
  includeSeal?: boolean | null;
}

export async function generateHrDocumentPdf(params: HrDocumentRenderParams): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // A4 Portrait: 595.28 x 841.89 points
  const width = 595.28;
  const height = 841.89;
  const page = pdfDoc.addPage([width, height]);

  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontHelveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const fontTimes = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontTimesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  // Palette
  const navy = rgb(0.07, 0.12, 0.28);
  const gold = rgb(0.82, 0.65, 0.25);
  const charcoal = rgb(0.12, 0.15, 0.2);
  const muted = rgb(0.38, 0.42, 0.5);
  const lightLine = rgb(0.85, 0.88, 0.92);

  const isCustomLetterhead = params.letterheadMode === "CUSTOM" && !!params.templateUrl;
  const hideDefaultHeaderFooter =
    params.hideDefaultHeaderFooter !== undefined && params.hideDefaultHeaderFooter !== null
      ? params.hideDefaultHeaderFooter
      : isCustomLetterhead;

  const leftMargin = Math.max(25, Number(params.leftMargin) || 45);
  const rightMargin = Math.max(25, Number(params.rightMargin) || 45);
  const topMargin = Math.max(40, Number(params.topMargin) || (isCustomLetterhead ? 130 : 105));
  const bottomMargin = Math.max(30, Number(params.bottomMargin) || 75);
  const contentWidth = width - leftMargin - rightMargin;

  // 0. EMBED CUSTOM LETTERHEAD TEMPLATE IF PROVIDED
  if (isCustomLetterhead && params.templateUrl) {
    try {
      let imgBytes: Uint8Array;
      if (params.templateUrl.startsWith("data:")) {
        const base64Data = params.templateUrl.split(",")[1];
        imgBytes = Uint8Array.from(Buffer.from(base64Data, "base64"));
      } else if (params.templateUrl.startsWith("http://") || params.templateUrl.startsWith("https://")) {
        const resp = await fetch(params.templateUrl);
        const arrayBuf = await resp.arrayBuffer();
        imgBytes = new Uint8Array(arrayBuf);
      } else {
        const localPath = path.isAbsolute(params.templateUrl)
          ? params.templateUrl
          : path.join(process.cwd(), "public", params.templateUrl);
        imgBytes = fs.readFileSync(localPath);
      }

      let bgImg;
      const lower = params.templateUrl.toLowerCase();
      if (lower.includes("image/jpeg") || lower.includes("image/jpg") || lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
        bgImg = await pdfDoc.embedJpg(imgBytes);
      } else {
        try {
          bgImg = await pdfDoc.embedPng(imgBytes);
        } catch {
          bgImg = await pdfDoc.embedJpg(imgBytes);
        }
      }

      if (bgImg) {
        page.drawImage(bgImg, {
          x: 0,
          y: 0,
          width,
          height,
        });
      }
    } catch (tmplErr) {
      console.warn("Custom letterhead template background embedding error:", tmplErr);
    }
  }

  // 1. BUILT-IN VECTOR HEADER (Render only if hideDefaultHeaderFooter is false)
  if (!hideDefaultHeaderFooter) {
    // Top Decorative Border Line
    page.drawRectangle({
      x: 0,
      y: height - 6,
      width,
      height: 6,
      color: navy,
    });
    page.drawRectangle({
      x: 0,
      y: height - 9,
      width,
      height: 3,
      color: gold,
    });

    // Logo
    let logoDrawn = false;
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    if (fs.existsSync(logoPath)) {
      try {
        const logoBytes = fs.readFileSync(logoPath);
        const logoImg = await pdfDoc.embedPng(logoBytes);
        const logoSize = 48;
        page.drawImage(logoImg, {
          x: leftMargin,
          y: height - 68,
          width: logoSize,
          height: logoSize,
        });
        logoDrawn = true;
      } catch (e) {
        console.warn("Logo embedding warning:", e);
      }
    }

    const headerLeftX = logoDrawn ? leftMargin + 57 : leftMargin;

    page.drawText("AISHWI TECHNOLOGIES", {
      x: headerLeftX,
      y: height - 38,
      size: 17,
      font: fontHelveticaBold,
      color: navy,
    });

    page.drawText("EMPOWERING TOMORROW, INNOVATING TODAY", {
      x: headerLeftX,
      y: height - 50,
      size: 7.5,
      font: fontHelveticaBold,
      color: gold,
    });

    page.drawText("Tech Innovation Hub, Hyderabad, Telangana - 500081, India", {
      x: headerLeftX,
      y: height - 62,
      size: 8,
      font: fontHelvetica,
      color: muted,
    });

    // Right-aligned contact info in header
    const contactText1 = "www.aishwitechnologies.com";
    const contactText2 = "hr@aishwitechnologies.com";
    const w1 = fontHelvetica.widthOfTextAtSize(contactText1, 8);
    const w2 = fontHelvetica.widthOfTextAtSize(contactText2, 8);

    page.drawText(contactText1, {
      x: width - rightMargin - w1,
      y: height - 42,
      size: 8,
      font: fontHelvetica,
      color: muted,
    });
    page.drawText(contactText2, {
      x: width - rightMargin - w2,
      y: height - 54,
      size: 8,
      font: fontHelvetica,
      color: muted,
    });

    // Header Divider Line
    page.drawLine({
      start: { x: leftMargin, y: height - 78 },
      end: { x: width - rightMargin, y: height - 78 },
      color: lightLine,
      thickness: 1,
    });
  }

  // Format Dates
  const formatDateStr = (d?: string | Date | null) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const issueDateFormatted = formatDateStr(params.issueDate || new Date());
  const startDateFormatted = formatDateStr(params.startDate) || "Commencement Date";
  const endDateFormatted = formatDateStr(params.endDate) || "Completion Date";

  // 2. DOCUMENT REFERENCE & DATE
  let cursorY = height - topMargin;

  page.drawText(`Ref: ${params.documentId}`, {
    x: leftMargin,
    y: cursorY,
    size: 9.5,
    font: fontHelveticaBold,
    color: navy,
  });

  const dateStr = `Date: ${issueDateFormatted}`;
  const dateStrWidth = fontHelvetica.widthOfTextAtSize(dateStr, 9.5);
  page.drawText(dateStr, {
    x: width - rightMargin - dateStrWidth,
    y: cursorY,
    size: 9.5,
    font: fontHelvetica,
    color: charcoal,
  });

  cursorY -= 25;

  // 3. RECIPIENT DETAILS
  page.drawText("To,", {
    x: leftMargin,
    y: cursorY,
    size: 10,
    font: fontHelveticaBold,
    color: charcoal,
  });
  cursorY -= 14;

  page.drawText(params.candidateName, {
    x: leftMargin,
    y: cursorY,
    size: 11,
    font: fontHelveticaBold,
    color: navy,
  });
  cursorY -= 13;

  if (params.collegeName) {
    page.drawText(params.collegeName, {
      x: leftMargin,
      y: cursorY,
      size: 9.5,
      font: fontHelvetica,
      color: charcoal,
    });
    cursorY -= 13;
  }

  if (params.department) {
    page.drawText(`Department of ${params.department}`, {
      x: leftMargin,
      y: cursorY,
      size: 9,
      font: fontHelvetica,
      color: muted,
    });
    cursorY -= 13;
  }

  if (params.candidateEmail) {
    page.drawText(`Email: ${params.candidateEmail}`, {
      x: leftMargin,
      y: cursorY,
      size: 8.5,
      font: fontHelvetica,
      color: muted,
    });
    cursorY -= 14;
  }

  cursorY -= 10;

  // 4. SUBJECT TITLE
  let subjectText = "";
  let documentHeading = "";

  switch (params.documentType) {
    case "OFFER_LETTER":
      documentHeading = "INTERNSHIP & TRAINING OFFER LETTER";
      subjectText = `SUBJECT: OFFER OF INTERNSHIP FOR THE ROLE OF ${params.roleTitle.toUpperCase()}`;
      break;
    case "COMPLETION_LETTER":
      documentHeading = "INTERNSHIP COMPLETION LETTER";
      subjectText = `SUBJECT: SUCCESSFUL COMPLETION OF INTERNSHIP - ${params.roleTitle.toUpperCase()}`;
      break;
    case "EXPERIENCE_LETTER":
      documentHeading = "WORK EXPERIENCE CERTIFICATE";
      subjectText = `SUBJECT: EXPERIENCE CERTIFICATE & SERVICE RECORD - ${params.roleTitle.toUpperCase()}`;
      break;
    case "RELIEVING_LETTER":
      documentHeading = "OFFICIAL RELIEVING LETTER";
      subjectText = `SUBJECT: RELIEVING ORDER AND SETTLEMENT - ${params.roleTitle.toUpperCase()}`;
      break;
    case "LOR":
      documentHeading = "LETTER OF RECOMMENDATION";
      subjectText = `SUBJECT: ACADEMIC & PROFESSIONAL RECOMMENDATION FOR ${params.candidateName.toUpperCase()}`;
      break;
    default:
      documentHeading = "OFFICIAL HR CERTIFICATION LETTER";
      subjectText = `SUBJECT: OFFICIAL HR DOCUMENTATION - ${params.roleTitle.toUpperCase()}`;
  }

  // Heading Banner
  page.drawText(documentHeading, {
    x: leftMargin,
    y: cursorY,
    size: 12.5,
    font: fontHelveticaBold,
    color: navy,
  });
  cursorY -= 16;

  page.drawText(subjectText, {
    x: leftMargin,
    y: cursorY,
    size: 9.5,
    font: fontHelveticaBold,
    color: charcoal,
  });
  // Subject underline
  const subjectWidth = fontHelveticaBold.widthOfTextAtSize(subjectText, 9.5);
  page.drawLine({
    start: { x: leftMargin, y: cursorY - 2 },
    end: { x: leftMargin + Math.min(subjectWidth, contentWidth), y: cursorY - 2 },
    color: navy,
    thickness: 0.8,
  });

  cursorY -= 22;

  // Salutation
  page.drawText(`Dear ${params.candidateName},`, {
    x: leftMargin,
    y: cursorY,
    size: 10,
    font: fontHelveticaBold,
    color: charcoal,
  });
  cursorY -= 18;

  // Helper to draw wrapped paragraph
  const drawParagraph = (text: string, fontSize: number = 9.5, lineSpacing: number = 14) => {
    const maxWidth = contentWidth;
    const words = text.split(" ");
    let line = "";

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const testWidth = fontHelvetica.widthOfTextAtSize(testLine, fontSize);

      if (testWidth > maxWidth) {
        page.drawText(line, {
          x: leftMargin,
          y: cursorY,
          size: fontSize,
          font: fontHelvetica,
          color: charcoal,
        });
        cursorY -= lineSpacing;
        line = word;
      } else {
        line = testLine;
      }
    }

    if (line) {
      page.drawText(line, {
        x: leftMargin,
        y: cursorY,
        size: fontSize,
        font: fontHelvetica,
        color: charcoal,
      });
      cursorY -= lineSpacing;
    }
    cursorY -= 6; // paragraph spacing
  };

  // 5. BODY PARAGRAPHS BASED ON DOCUMENT TYPE
  if (params.contentOverride?.trim()) {
    // Custom body provided
    const paragraphs = params.contentOverride.split("\n\n");
    for (const p of paragraphs) {
      if (p.trim()) drawParagraph(p.trim());
    }
  } else if (params.documentType === "OFFER_LETTER") {
    drawParagraph(
      `We are pleased to extend this formal offer of Internship to you at Aishwi Technologies in the capacity of ${params.roleTitle} within our ${params.departmentName || "Engineering & Innovation Division"}. We were immensely impressed with your credentials, technical aptitude, and enthusiasm for developing modern technology solutions.`
    );

    drawParagraph(
      `Your internship is scheduled to commence on ${startDateFormatted} and conclude on ${endDateFormatted}. During this tenure, you will work on live industrial projects, collaborate directly with our senior development teams, and gain hands-on architectural experience.`
    );

    // Terms bullets
    page.drawText("Terms & Key Information:", {
      x: leftMargin,
      y: cursorY,
      size: 9.5,
      font: fontHelveticaBold,
      color: navy,
    });
    cursorY -= 15;

    const bullets = [
      `• Position Title: ${params.roleTitle}`,
      `• Department / Track: ${params.departmentName || "Software & AI Solutions"}`,
      `• Internship Duration: ${startDateFormatted} to ${endDateFormatted}`,
      `• Stipend / Compensation: ${params.stipend || "Performance & Milestone Based"}`,
      "• Workplace Model: Industrial Hybrid / Mentored Project Engagement",
    ];

    for (const b of bullets) {
      page.drawText(b, {
        x: leftMargin + 10,
        y: cursorY,
        size: 9,
        font: fontHelvetica,
        color: charcoal,
      });
      cursorY -= 13;
    }
    cursorY -= 6;

    drawParagraph(
      "As an intern at Aishwi Technologies, you will be expected to maintain the highest standards of professional conduct, confidentiality, and technical rigor. All intellectual property, project codebases, and proprietary systems created during this period shall remain the exclusive property of Aishwi Technologies."
    );

    drawParagraph(
      "Please review and confirm your acceptance of this offer by signing and returning a copy of this letter. We are delighted to welcome you to the Aishwi Technologies family and look forward to an enriching engagement."
    );
  } else if (params.documentType === "COMPLETION_LETTER") {
    drawParagraph(
      `This is to officially certify that ${params.candidateName} has successfully completed the industrial internship program at Aishwi Technologies in the role of ${params.roleTitle}.`
    );

    drawParagraph(
      `The internship program was carried out from ${startDateFormatted} to ${endDateFormatted}. Throughout this tenure, ${params.candidateName} was assigned to our ${params.departmentName || "Core Engineering Division"} and demonstrated outstanding commitment, problem-solving abilities, and collaborative teamwork.`
    );

    // Summary block
    page.drawText("Performance Assessment & Highlights:", {
      x: leftMargin,
      y: cursorY,
      size: 9.5,
      font: fontHelveticaBold,
      color: navy,
    });
    cursorY -= 15;

    const highlights = [
      `• Project Domain: ${params.roleTitle} & Applied Solutions`,
      `• Tenure Served: ${startDateFormatted} to ${endDateFormatted}`,
      "• Attendance & Diligence: Exemplary / Complete",
      "• Technical Deliverables: Successfully Completed & Verified",
      "• Professional Conduct: Excellent",
    ];

    for (const h of highlights) {
      page.drawText(h, {
        x: leftMargin + 10,
        y: cursorY,
        size: 9,
        font: fontHelvetica,
        color: charcoal,
      });
      cursorY -= 13;
    }
    cursorY -= 6;

    drawParagraph(
      "We found the candidate to be punctual, inquisitive, and self-motivated with a high standard of professional ethics. The deliverables produced met our industrial benchmark criteria."
    );

    drawParagraph(
      "We congratulate the candidate on this successful milestone and wish them continued success, excellence, and achievement in all their future academic and professional pursuits."
    );
  } else if (params.documentType === "EXPERIENCE_LETTER") {
    drawParagraph(
      `This letter certifies that ${params.candidateName} was engaged with Aishwi Technologies as a ${params.roleTitle} from ${startDateFormatted} to ${endDateFormatted}.`
    );

    drawParagraph(
      `During this professional tenure, ${params.candidateName} was actively involved in architecture, project execution, and technical deliverables within our ${params.departmentName || "Engineering and Product Development Group"}. The candidate exhibited sound technical knowledge, analytical acumen, and dedication towards meeting project deadlines.`
    );

    drawParagraph(
      `During the tenure of service, their conduct, character, and professional integrity were found to be exemplary. They have been relieved of all responsibilities and organizational obligations as of ${endDateFormatted} in good standing.`
    );

    drawParagraph(
      "We thank them for their valuable contributions to Aishwi Technologies and extend our best wishes for their future career endeavors."
    );
  } else {
    // Recommendation Letter (LOR) / Default
    drawParagraph(
      `It gives me immense pleasure to write this Letter of Recommendation for ${params.candidateName}, who has worked closely with our technical team as a ${params.roleTitle} from ${startDateFormatted} to ${endDateFormatted}.`
    );

    drawParagraph(
      `During their association with Aishwi Technologies, ${params.candidateName} proved to be a highly dedicated, technically astute, and reliable professional. They demonstrated a profound ability to grasp complex problems and implement high-quality solutions with attention to detail.`
    );

    drawParagraph(
      "Their strong interpersonal skills, eagerness to learn, and proactive approach made them a valuable member of our cohort. I have no hesitation in strongly recommending them for advanced academic programs or professional employment opportunities."
    );

    drawParagraph(
      "Please feel free to reach out to our Human Resources department should you require any additional information or verification regarding their tenure."
    );
  }

  // 6. CLOSING & SIGNATORY BLOCK
  cursorY = Math.max(cursorY - 10, bottomMargin + 85);

  page.drawText("Yours sincerely,", {
    x: leftMargin,
    y: cursorY,
    size: 9.5,
    font: fontHelvetica,
    color: charcoal,
  });
  cursorY -= 14;

  page.drawText("For AISHWI TECHNOLOGIES", {
    x: leftMargin,
    y: cursorY,
    size: 10,
    font: fontHelveticaBold,
    color: navy,
  });
  cursorY -= 10;

  // Embed Signature if present
  const sigSrc = params.signatureUrl;
  if (sigSrc) {
    try {
      let sigImg: any = null;
      if (sigSrc.startsWith("data:image/png;base64,")) {
        const b64 = sigSrc.replace("data:image/png;base64,", "");
        sigImg = await pdfDoc.embedPng(Buffer.from(b64, "base64"));
      } else if (
        sigSrc.startsWith("data:image/jpeg;base64,") ||
        sigSrc.startsWith("data:image/jpg;base64,")
      ) {
        const b64 = sigSrc.replace(/^data:image\/jpe?g;base64,/, "");
        sigImg = await pdfDoc.embedJpg(Buffer.from(b64, "base64"));
      } else if (fs.existsSync(sigSrc)) {
        const imgBytes = fs.readFileSync(sigSrc);
        sigImg = sigSrc.endsWith(".png")
          ? await pdfDoc.embedPng(imgBytes)
          : await pdfDoc.embedJpg(imgBytes);
      }

      if (sigImg) {
        const sigW = 110;
        const sigH = Math.min((sigImg.height / sigImg.width) * sigW, 45);
        page.drawImage(sigImg, {
          x: leftMargin,
          y: cursorY - sigH,
          width: sigW,
          height: sigH,
        });
        cursorY -= sigH + 5;
      }
    } catch (sigErr) {
      console.warn("HR document signature embedding warning:", sigErr);
      cursorY -= 35;
    }
  } else {
    cursorY -= 35;
  }

  // Signatory Name & Title
  const signatoryName = params.signatoryName || "Mahesh Perla";
  const signatoryTitle = params.signatoryTitle || "Director & Authorized Signatory";

  page.drawLine({
    start: { x: leftMargin, y: cursorY },
    end: { x: leftMargin + 130, y: cursorY },
    color: charcoal,
    thickness: 1,
  });
  cursorY -= 12;

  page.drawText(signatoryName, {
    x: leftMargin,
    y: cursorY,
    size: 10,
    font: fontHelveticaBold,
    color: navy,
  });
  cursorY -= 12;

  page.drawText(signatoryTitle, {
    x: leftMargin,
    y: cursorY,
    size: 8.5,
    font: fontHelvetica,
    color: muted,
  });

  // Official Corporate Seal Graphics
  if (params.includeSeal !== false) {
    const sealX = width - rightMargin - 110;
    const sealY = cursorY + 25;
    page.drawCircle({
      x: sealX + 40,
      y: sealY,
      size: 32,
      borderColor: navy,
      borderWidth: 1.5,
      color: rgb(0.98, 0.98, 1.0),
    });
    page.drawCircle({
      x: sealX + 40,
      y: sealY,
      size: 28,
      borderColor: gold,
      borderWidth: 0.8,
    });
    page.drawText("AISHWI", {
      x: sealX + 26,
      y: sealY + 4,
      size: 7.5,
      font: fontHelveticaBold,
      color: navy,
    });
    page.drawText("SEAL", {
      x: sealX + 30,
      y: sealY - 6,
      size: 7.5,
      font: fontHelveticaBold,
      color: gold,
    });
  }

  // 7. FOOTER
  if (!hideDefaultHeaderFooter) {
    page.drawLine({
      start: { x: leftMargin, y: 48 },
      end: { x: width - rightMargin, y: 48 },
      color: lightLine,
      thickness: 0.8,
    });

    const footerNote = "Aishwi Technologies • Corporate HR & Verified Credential Record • Anti-Tamper Authenticated";
    const footerNoteWidth = fontHelvetica.widthOfTextAtSize(footerNote, 7.5);
    page.drawText(footerNote, {
      x: (width - footerNoteWidth) / 2,
      y: 36,
      size: 7.5,
      font: fontHelvetica,
      color: muted,
    });

    const verifyNotice = `Verify Ref: ${params.documentId} at: https://certflow-pearl.vercel.app`;
    const verifyNoticeWidth = fontHelvetica.widthOfTextAtSize(verifyNotice, 7.5);
    page.drawText(verifyNotice, {
      x: (width - verifyNoticeWidth) / 2,
      y: 25,
      size: 7.5,
      font: fontHelveticaBold,
      color: navy,
    });

    // Bottom colored line
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height: 4,
      color: navy,
    });
  }

  return pdfDoc.save();
}
