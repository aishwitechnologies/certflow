import JSZip from "jszip";
import { saveFile } from "./storage";
import { generateZipFilename } from "./utils";

export interface ZipFileEntry {
  filename: string;
  content: Uint8Array | Buffer;
}

/**
 * Create a ZIP archive from an array of files and save it to storage
 */
export async function createBatchZip(
  programName: string,
  files: ZipFileEntry[]
): Promise<{ zipFilename: string; storageUrl: string; buffer: Buffer }> {
  const zip = new JSZip();

  for (const file of files) {
    zip.file(file.filename, file.content);
  }

  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  const zipFilename = generateZipFilename(programName);
  const storageUrl = await saveFile("zips", zipFilename, zipBuffer);

  return { zipFilename, storageUrl, buffer: zipBuffer };
}
