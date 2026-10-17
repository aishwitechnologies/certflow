import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const programs = await prisma.program.findMany({
      include: {
        defaultTemplate: {
          select: { id: true, name: true },
        },
        _count: {
          select: { certificates: true, candidates: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ programs });
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

    const program = await prisma.program.create({
      data: {
        organizationId: orgId,
        programId: data.programId || `PROG-${Date.now().toString().slice(-4)}`,
        name: data.name,
        description: data.description,
        duration: data.duration,
        certificateType: data.certificateType || "INTERNSHIP",
        defaultTemplateId: data.defaultTemplateId || null,
        status: data.status || "ACTIVE",
      },
    });

    await logAudit({
      organizationId: orgId,
      userId: session?.userId,
      action: "PROGRAM_CREATED",
      entity: "Program",
      entityId: program.id,
      details: { name: program.name, programId: program.programId },
    });

    return NextResponse.json({ success: true, program });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
