import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalCertificates,
      todayCertificates,
      monthCertificates,
      totalCandidates,
      validCertificates,
      revokedCertificates,
      activeProgramsCount,
      activeTemplatesCount,
      pendingBatchesCount,
      failedBatchesCount,
      totalVerifications,
      programsBreakdown,
      recentCertificates,
    ] = await Promise.all([
      prisma.certificate.count(),
      prisma.certificate.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.certificate.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.candidate.count(),
      prisma.certificate.count({ where: { status: "VALID" } }),
      prisma.certificate.count({ where: { status: "REVOKED" } }),
      prisma.program.count({ where: { status: "ACTIVE" } }),
      prisma.certificateTemplate.count({ where: { status: "ACTIVE" } }),
      prisma.certificateBatch.count({ where: { status: "QUEUED" } }),
      prisma.certificateBatch.count({ where: { status: "FAILED" } }),
      prisma.verificationLog.count(),
      prisma.program.findMany({
        select: {
          id: true,
          name: true,
          _count: { select: { certificates: true } },
        },
      }),
      prisma.certificate.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { program: true },
      }),
    ]);

    return NextResponse.json({
      metrics: {
        totalCertificates,
        todayCertificates,
        monthCertificates,
        totalCandidates,
        validCertificates,
        revokedCertificates,
        activeProgramsCount,
        activeTemplatesCount,
        pendingBatchesCount,
        failedBatchesCount,
        totalVerifications,
      },
      programsBreakdown: programsBreakdown.map((p) => ({
        id: p.id,
        name: p.name,
        count: p._count.certificates,
      })),
      recentCertificates,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
