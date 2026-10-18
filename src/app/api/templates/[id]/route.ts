import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const template = await prisma.certificateTemplate.findUnique({
      where: { id: params.id },
      include: {
        fields: true,
      },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    const data = await req.json();

    const template = await prisma.certificateTemplate.findUnique({
      where: { id: params.id },
      include: { fields: true },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Save previous version in TemplateVersion table
    await prisma.templateVersion.create({
      data: {
        templateId: template.id,
        version: template.version,
        layoutData: JSON.stringify({
          name: template.name,
          width: template.width,
          height: template.height,
          orientation: template.orientation,
          backgroundUrl: template.backgroundUrl,
          signatureUrl: template.signatureUrl,
          signatureX: template.signatureX,
          signatureY: template.signatureY,
          signatureWidth: template.signatureWidth,
          signatureAlignment: template.signatureAlignment,
          signatoryTitle: template.signatoryTitle,
          signatoryName: template.signatoryName,
          fields: template.fields,
        }),
        notes: `Updated by ${session?.name || "Admin"}`,
      },
    });

    // Update template metadata
    const updatedTemplate = await prisma.certificateTemplate.update({
      where: { id: template.id },
      data: {
        name: data.name || template.name,
        description: data.description !== undefined ? data.description : template.description,
        backgroundUrl: data.backgroundUrl !== undefined ? data.backgroundUrl : template.backgroundUrl,
        signatureUrl: data.signatureUrl !== undefined ? data.signatureUrl : template.signatureUrl,
        signatureX: data.signatureX !== undefined ? (data.signatureX !== null ? parseFloat(data.signatureX) : null) : template.signatureX,
        signatureY: data.signatureY !== undefined ? (data.signatureY !== null ? parseFloat(data.signatureY) : null) : template.signatureY,
        signatureWidth: data.signatureWidth !== undefined ? (data.signatureWidth !== null ? parseFloat(data.signatureWidth) : null) : template.signatureWidth,
        signatureAlignment: data.signatureAlignment !== undefined ? data.signatureAlignment : template.signatureAlignment,
        signatoryTitle: data.signatoryTitle !== undefined ? data.signatoryTitle : template.signatoryTitle,
        signatoryName: data.signatoryName !== undefined ? data.signatoryName : template.signatoryName,
        orientation: data.orientation || template.orientation,
        width: data.orientation === "PORTRAIT" ? 595.28 : 841.89,
        height: data.orientation === "PORTRAIT" ? 841.89 : 595.28,
        version: { increment: 1 },
      },
    });

    // Replace fields if provided
    if (data.fields && Array.isArray(data.fields)) {
      await prisma.templateField.deleteMany({
        where: { templateId: template.id },
      });

      for (const f of data.fields) {
        await prisma.templateField.create({
          data: {
            templateId: template.id,
            fieldKey: f.fieldKey,
            label: f.label || f.fieldKey,
            x: f.x,
            y: f.y,
            fontSize: f.fontSize || 16,
            fontFamily: f.fontFamily || "Helvetica",
            fontWeight: f.fontWeight || "normal",
            color: f.color || "#111827",
            alignment: f.alignment || "center",
            maxWidth: f.maxWidth || null,
            staticValue: f.staticValue || null,
          },
        });
      }
    }

    await logAudit({
      organizationId: template.organizationId,
      userId: session?.userId,
      action: "TEMPLATE_UPDATED",
      entity: "CertificateTemplate",
      entityId: template.id,
      details: { name: updatedTemplate.name, version: updatedTemplate.version },
    });

    const refreshed = await prisma.certificateTemplate.findUnique({
      where: { id: template.id },
      include: { fields: true },
    });

    return NextResponse.json({ success: true, template: refreshed });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
