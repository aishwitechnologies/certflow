import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const where: any = {};
    if (search.trim()) {
      where.OR = [
        { name: { contains: search.trim() } },
        { email: { contains: search.trim() } },
        { college: { contains: search.trim() } },
      ];
    }

    const candidates = await prisma.candidate.findMany({
      where,
      include: {
        program: { select: { id: true, name: true } },
        certificates: {
          select: {
            id: true,
            certificateId: true,
            status: true,
            issueDate: true,
            pdfPath: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ candidates });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
