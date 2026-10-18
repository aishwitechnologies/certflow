import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Aishwi Technologies database...");

  // 1. Create Organization
  const org = await prisma.organization.upsert({
    where: { code: "DEFAULT" },
    update: {
      name: "Aishwi Technologies",
      website: "https://aishwitechnologies.com",
      verificationUrl: "https://certflow-pearl.vercel.app/verify",
    },
    create: {
      name: "Aishwi Technologies",
      code: "DEFAULT",
      website: "https://aishwitechnologies.com",
      verificationUrl: "https://certflow-pearl.vercel.app/verify",
    },
  });

  // 2. Create System Settings (ID configuration)
  const defaultSettings = [
    { key: "ID_PREFIX", value: "AT", description: "Configurable Certificate ID prefix" },
    { key: "ID_SEPARATOR", value: "-", description: "Separator between ID components" },
    { key: "ID_INCLUDE_YEAR", value: "false", description: "Whether to include 4-digit year" },
    { key: "ID_INCLUDE_MONTH", value: "true", description: "Whether to include 2-digit month" },
    { key: "ID_PADDING", value: "2", description: "Sequence number zero-padding length" },
    { key: "ID_MONTHLY_RESET", value: "true", description: "Reset sequence to 01 each month" },
  ];

  for (const s of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: {
        organizationId_key: {
          organizationId: org.id,
          key: s.key,
        },
      },
      update: { value: s.value },
      create: {
        organizationId: org.id,
        key: s.key,
        value: s.value,
        description: s.description,
      },
    });
  }

  // 3. Create Authorized Super Admins
  const superAdminPasswordHash = await bcrypt.hash("Aishwi@2021", 10);

  const superAdmins = [
    { name: "Mahesh Perla", email: "mahesh.perla@aishwitech.in" },
    { name: "Ganesh", email: "ganesh@aishwitech.in" },
    { name: "Ruthvik Sonti", email: "ruthvik.sonti@aishwitech.in" },
  ];

  for (const admin of superAdmins) {
    await prisma.user.upsert({
      where: { email: admin.email },
      update: {
        name: admin.name,
        passwordHash: superAdminPasswordHash,
        role: "SUPER_ADMIN",
        isActive: true,
      },
      create: {
        organizationId: org.id,
        name: admin.name,
        email: admin.email,
        passwordHash: superAdminPasswordHash,
        role: "SUPER_ADMIN",
        isActive: true,
      },
    });
  }

  // 4. Create Standard Certificate Template
  let template = await prisma.certificateTemplate.findFirst({
    where: { organizationId: org.id, name: "Standard Internship Certificate" },
  });

  if (!template) {
    template = await prisma.certificateTemplate.create({
      data: {
        organizationId: org.id,
        name: "Standard Internship Certificate",
        certificateType: "INTERNSHIP",
        description: "Official landscape A4 certificate template for internship and training completion.",
        pageSize: "A4",
        orientation: "LANDSCAPE",
        width: 841.89,
        height: 595.28,
        status: "ACTIVE",
        version: 1,
      },
    });

    // Create Template Fields
    const fields = [
      {
        fieldKey: "{{NAME}}",
        label: "Candidate Name",
        x: 420.94,
        y: 380,
        fontSize: 26,
        fontFamily: "Times-Roman",
        fontWeight: "bold",
        color: "#1e3a8a", // Navy
        alignment: "center",
      },
      {
        fieldKey: "SUBTITLE",
        label: "Completion Subtitle",
        x: 420.94,
        y: 330,
        fontSize: 14,
        fontFamily: "Helvetica",
        fontWeight: "normal",
        color: "#475569",
        alignment: "center",
        staticValue: "has successfully completed the intensive internship program in",
      },
      {
        fieldKey: "{{PROGRAM_NAME}}",
        label: "Program Name",
        x: 420.94,
        y: 295,
        fontSize: 20,
        fontFamily: "Helvetica",
        fontWeight: "bold",
        color: "#0f172a",
        alignment: "center",
      },
      {
        fieldKey: "DATES_TEXT",
        label: "Tenure Statement",
        x: 420.94,
        y: 225,
        fontSize: 12,
        fontFamily: "Helvetica",
        fontWeight: "normal",
        color: "#334155",
        alignment: "center",
        staticValue: "Demonstrated exemplary commitment from {{START_DATE}} to {{END_DATE}}.",
      },
      {
        fieldKey: "{{CERTIFICATE_ID}}",
        label: "Certificate ID",
        x: 60,
        y: 70,
        fontSize: 11,
        fontFamily: "Helvetica",
        fontWeight: "bold",
        color: "#334155",
        alignment: "left",
      },
      {
        fieldKey: "SIGNATURE_LINE_1",
        label: "Authorized Signatory",
        x: 700,
        y: 70,
        fontSize: 11,
        fontFamily: "Helvetica",
        fontWeight: "bold",
        color: "#334155",
        alignment: "center",
        staticValue: "Program Director",
      },
    ];

    for (const f of fields) {
      await prisma.templateField.create({
        data: {
          templateId: template.id,
          ...f,
        },
      });
    }
  }

  // 5. Create Programs
  const programsData = [
    {
      programId: "PROG-AI-01",
      name: "AI Internship",
      description: "Artificial Intelligence and Machine Learning Industrial Internship",
      duration: "4 Weeks",
      certificateType: "INTERNSHIP",
      defaultTemplateId: template.id,
    },
    {
      programId: "PROG-FS-01",
      name: "Full Stack Development Internship",
      description: "Modern Web Development with Next.js, Node.js and Cloud",
      duration: "8 Weeks",
      certificateType: "INTERNSHIP",
      defaultTemplateId: template.id,
    },
    {
      programId: "PROG-DA-01",
      name: "Data Analytics Internship",
      description: "Data Engineering, SQL, Python, and PowerBI Analytics",
      duration: "4 Weeks",
      certificateType: "INTERNSHIP",
      defaultTemplateId: template.id,
    },
    {
      programId: "PROG-GAI-01",
      name: "Generative AI Workshop",
      description: "Hands-on Large Language Models and Diffusion Systems Workshop",
      duration: "2 Days",
      certificateType: "WORKSHOP",
      defaultTemplateId: template.id,
    },
  ];

  const createdPrograms: any = {};
  for (const p of programsData) {
    const prog = await prisma.program.upsert({
      where: { programId: p.programId },
      update: {},
      create: {
        organizationId: org.id,
        ...p,
      },
    });
    createdPrograms[p.programId] = prog;
  }

  // 6. Create Initial Demo Candidates & Sample Verified Certificate
  const aiProgram = createdPrograms["PROG-AI-01"];
  const candidateRavi = await prisma.candidate.upsert({
    where: {
      organizationId_email_programId: {
        organizationId: org.id,
        email: "ravi.kumar@example.com",
        programId: aiProgram.id,
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      name: "Ravi Kumar",
      email: "ravi.kumar@example.com",
      college: "ABC College of Engineering",
      department: "Computer Science & Engineering",
      programId: aiProgram.id,
      domain: "Artificial Intelligence",
      startDate: new Date("2026-10-01"),
      endDate: new Date("2026-10-31"),
    },
  });

  // Create sequence record for October 2026
  await prisma.certificateSequence.upsert({
    where: {
      organizationId_prefix_periodKey: {
        organizationId: org.id,
        prefix: "AT",
        periodKey: "2026-10",
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      prefix: "AT",
      periodKey: "2026-10",
      currentSequence: 1,
    },
  });

  // Create an initial verified certificate: AT-10-01
  const certId = "AT-10-01";
  await prisma.certificate.upsert({
    where: { certificateId: certId },
    update: {},
    create: {
      certificateId: certId,
      organizationId: org.id,
      candidateId: candidateRavi.id,
      programId: aiProgram.id,
      templateId: template.id,
      candidateName: "Ravi Kumar",
      collegeName: "ABC College of Engineering",
      department: "Computer Science & Engineering",
      domain: "Artificial Intelligence",
      startDate: new Date("2026-10-01"),
      endDate: new Date("2026-10-31"),
      issueDate: new Date("2026-10-31"),
      status: "VALID",
      verificationUrl: `/verify/${certId}`,
    },
  });

  console.log("Seeding complete! Admin user: admin@aishwitechnologies.com / Admin@123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
