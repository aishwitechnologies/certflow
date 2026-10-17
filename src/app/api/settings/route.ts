import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrgIdConfig, formatCertificateId } from "@/lib/id-generator";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const org = await prisma.organization.findFirst();
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const config = await getOrgIdConfig(org.id);
    const sampleId = formatCertificateId(1, config);

    return NextResponse.json({
      organization: org,
      idConfig: config,
      previewSampleId: sampleId,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const { orgName, website, idConfig } = await req.json();

    const org = await prisma.organization.findFirst();
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    if (orgName || website) {
      await prisma.organization.update({
        where: { id: org.id },
        data: {
          name: orgName || org.name,
          website: website !== undefined ? website : org.website,
        },
      });
    }

    if (idConfig) {
      const keys = [
        { key: "ID_PREFIX", value: idConfig.prefix || "AT" },
        { key: "ID_SEPARATOR", value: idConfig.separator || "-" },
        { key: "ID_INCLUDE_YEAR", value: String(idConfig.includeYear === true) },
        { key: "ID_INCLUDE_MONTH", value: String(idConfig.includeMonth === true) },
        { key: "ID_PADDING", value: String(idConfig.padding || 2) },
        { key: "ID_MONTHLY_RESET", value: String(idConfig.monthlyReset === true) },
      ];

      for (const item of keys) {
        await prisma.systemSetting.upsert({
          where: {
            organizationId_key: {
              organizationId: org.id,
              key: item.key,
            },
          },
          update: { value: item.value },
          create: {
            organizationId: org.id,
            key: item.key,
            value: item.value,
          },
        });
      }
    }

    await logAudit({
      organizationId: org.id,
      userId: session?.userId,
      action: "SETTINGS_UPDATED",
      entity: "SystemSetting",
      details: { idConfig },
    });

    const updatedConfig = await getOrgIdConfig(org.id);
    const sampleId = formatCertificateId(1, updatedConfig);

    return NextResponse.json({
      success: true,
      idConfig: updatedConfig,
      previewSampleId: sampleId,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
