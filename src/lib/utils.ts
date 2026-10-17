import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a Date object or ISO string to standard human display
 * e.g. "31 October 2026"
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "N/A";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "Invalid Date";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Sanitize filename strictly according to requirement:
 * Replace spaces with underscores, remove invalid filesystem characters,
 * preserve candidate name, format: Candidate_Name_Certificate_ID.pdf
 */
export function generatePdfFilename(candidateName: string, certificateId: string): string {
  const cleanName = candidateName
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[/\\?%*:|"<>]/g, "");
  
  const cleanId = certificateId.trim().replace(/[/\\?%*:|"<>]/g, "");
  return `${cleanName}_${cleanId}.pdf`;
}

/**
 * Sanitize ZIP filename: Program_Name_Certificates_YYYY-MM.zip
 */
export function generateZipFilename(programName: string, date: Date = new Date()): string {
  const cleanName = programName
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[/\\?%*:|"<>]/g, "");
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${cleanName}_Certificates_${year}-${month}.zip`;
}
