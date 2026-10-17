import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const templates = await prisma.certificateTemplate.findMany({
      include: {
        fields: true,
        _count: {
          select: { certificates: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ templates });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const data = await req.json();

    const org = await prisma.organization.findFirst();
    const orgId = session?.organizationId || org?.id;

    if (!orgId) {
      return NextResponse.json({ error: "Organization required" }, { status: 400 });
    }

    const template = await prisma.certificateTemplate.create({
      data: {
        organizationId: orgId,
        name: data.name,
        certificateType: data.certificateType || "INTERNSHIP",
        description: data.description,
        pageSize: data.pageSize || "A4",
        orientation: data.orientation || "LANDSCAPE",
        width: data.orientation === "PORTRAIT" ? 595.28 : 841.89,
        height: data.orientation === "PORTRAIT" ? 841.89 : 595.28,
        backgroundUrl: data.backgroundUrl || null,
        signatureUrl: data.signatureUrl || null,
        status: "ACTIVE",
      },
    });

    // If initial fields were provided
    if (data.fields && Array.isArray(data.fields)) {
      for (const field of data.fields) {
        await prisma.templateField.create({
          data: {
            templateId: template.id,
            fieldKey: field.fieldKey,
            label: field.label || field.fieldKey,
            x: field.x || 420,
            y: field.y || 300,
            fontSize: field.fontSize || 16,
            fontFamily: field.fontFamily || "Helvetica",
            fontWeight: field.fontWeight || "normal",
            color: field.color || "#111827",
            alignment: field.alignment || "center",
            staticValue: field.staticValue || null,
          },
        });
      }
    }

    await logAudit({
      organizationId: orgId,
      userId: session?.userId,
      action: "TEMPLATE_CREATED",
      entity: "CertificateTemplate",
      entityId: template.id,
      details: { name: template.name },
    });

    return NextResponse.json({ success: true, template });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
