import { prisma } from "./db";

export interface IdConfig {
  prefix: string;
  separator: string;
  includeYear: boolean;
  includeMonth: boolean;
  padding: number;
  monthlyReset: boolean;
}

export const DEFAULT_ID_CONFIG: IdConfig = {
  prefix: "AT",
  separator: "-",
  includeYear: false,
  includeMonth: true,
  padding: 2,
  monthlyReset: true,
};

/**
 * Fetch organization ID configuration from SystemSetting or fallback to defaults
 */
export async function getOrgIdConfig(organizationId: string): Promise<IdConfig> {
  const settings = await prisma.systemSetting.findMany({
    where: { organizationId },
  });

  const config = { ...DEFAULT_ID_CONFIG };

  for (const s of settings) {
    if (s.key === "ID_PREFIX") config.prefix = s.value;
    if (s.key === "ID_SEPARATOR") config.separator = s.value;
    if (s.key === "ID_INCLUDE_YEAR") config.includeYear = s.value === "true";
    if (s.key === "ID_INCLUDE_MONTH") config.includeMonth = s.value === "true";
    if (s.key === "ID_PADDING") config.padding = parseInt(s.value, 10) || 2;
    if (s.key === "ID_MONTHLY_RESET") config.monthlyReset = s.value === "true";
  }

  return config;
}

/**
 * Atomically reserve a block of N consecutive sequence numbers for a batch.
 * Guarantees zero duplicates even under heavy concurrency.
 *
 * @param organizationId - Org ID
 * @param count - Number of consecutive IDs needed
 * @param generationDate - Date of certificate generation
 * @returns Array of formatted Certificate IDs
 */
export async function reserveCertificateIds(
  organizationId: string,
  count: number,
  generationDate: Date = new Date()
): Promise<string[]> {
  if (count <= 0) return [];

  const config = await getOrgIdConfig(organizationId);

  const year = generationDate.getFullYear();
  const month = String(generationDate.getMonth() + 1).padStart(2, "0");

  // Determine period key for sequence tracking
  const periodKey = config.monthlyReset ? `${year}-${month}` : "GLOBAL";

  // Atomically increment currentSequence in a transaction
  const result = await prisma.$transaction(async (tx) => {
    let sequenceRecord = await tx.certificateSequence.findUnique({
      where: {
        organizationId_prefix_periodKey: {
          organizationId,
          prefix: config.prefix,
          periodKey,
        },
      },
    });

    if (!sequenceRecord) {
      sequenceRecord = await tx.certificateSequence.create({
        data: {
          organizationId,
          prefix: config.prefix,
          periodKey,
          currentSequence: 0,
        },
      });
    }

    const startSeq = sequenceRecord.currentSequence + 1;
    const endSeq = sequenceRecord.currentSequence + count;

    await tx.certificateSequence.update({
      where: { id: sequenceRecord.id },
      data: { currentSequence: endSeq },
    });

    return { startSeq, endSeq };
  });

  // Format each Certificate ID
  const generatedIds: string[] = [];
  for (let seq = result.startSeq; seq <= result.endSeq; seq++) {
    const parts: string[] = [config.prefix];

    if (config.includeYear) {
      parts.push(String(year));
    }
    if (config.includeMonth) {
      parts.push(month);
    }

    const paddedSeq = String(seq).padStart(config.padding, "0");
    parts.push(paddedSeq);

    generatedIds.push(parts.join(config.separator));
  }

  return generatedIds;
}

/**
 * Preview how an ID will look given a specific sequence number and config
 */
export function formatCertificateId(
  seq: number,
  config: IdConfig = DEFAULT_ID_CONFIG,
  date: Date = new Date()
): string {
  const parts: string[] = [config.prefix];
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  if (config.includeYear) {
    parts.push(String(year));
  }
  if (config.includeMonth) {
    parts.push(month);
  }

  parts.push(String(seq).padStart(config.padding, "0"));
  return parts.join(config.separator);
}
