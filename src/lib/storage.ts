import fs from "fs";
import path from "path";

// In Vercel serverless, /tmp is writable. In local development, public/generated is writable.
const STORAGE_ROOT = process.env.VERCEL
  ? path.join("/tmp", "certflow-storage")
  : path.join(process.cwd(), "public", "storage");

// Ensure base directories exist
function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Save a buffer to storage (PDF, ZIP, Image)
 */
export async function saveFile(
  subfolder: "certificates" | "zips" | "templates" | "uploads",
  filename: string,
  buffer: Buffer | Uint8Array
): Promise<string> {
  const targetDir = path.join(STORAGE_ROOT, subfolder);
  ensureDir(targetDir);

  const filePath = path.join(targetDir, filename);
  fs.writeFileSync(filePath, Buffer.from(buffer));

  // Return relative or internal URL
  return `/api/storage?folder=${subfolder}&file=${encodeURIComponent(filename)}`;
}

/**
 * Get the absolute file path on disk
 */
export function getFilePath(subfolder: string, filename: string): string {
  return path.join(STORAGE_ROOT, subfolder, filename);
}

/**
 * Read file buffer from storage
 */
export function readFile(subfolder: string, filename: string): Buffer | null {
  const filePath = path.join(STORAGE_ROOT, subfolder, filename);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return fs.readFileSync(filePath);
}
