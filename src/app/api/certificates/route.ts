import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const programId = searchParams.get("programId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search.trim()) {
      where.OR = [
        { certificateId: { contains: search.trim().toUpperCase() } },
        { candidateName: { contains: search.trim() } },
        { collegeName: { contains: search.trim() } },
      ];
    }

    if (programId && programId !== "ALL") {
      where.programId = programId;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    const [total, certificates] = await Promise.all([
      prisma.certificate.count({ where }),
      prisma.certificate.findMany({
        where,
        include: {
          program: { select: { id: true, name: true } },
          template: { select: { id: true, name: true } },
          candidate: { select: { id: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      certificates,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
