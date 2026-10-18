const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const SUPERADMINS = [
  {
    name: "Mahesh Perla",
    email: "mahesh.perla@aishwitech.in",
    password: "Aishwi@2021",
  },
  {
    name: "Ganesh",
    email: "ganesh@aishwitech.in",
    password: "Aishwi@2021",
  },
  {
    name: "Ruthvik Sonti",
    email: "ruthvik.sonti@aishwitech.in",
    password: "Aishwi@2021",
  },
];

async function main() {
  console.log("Setting up Aishwi Technologies Super Admin accounts...");

  const org = await prisma.organization.findFirst();
  if (!org) {
    throw new Error("No organization found in database!");
  }

  for (const admin of SUPERADMINS) {
    const passwordHash = await bcrypt.hash(admin.password, 10);
    const user = await prisma.user.upsert({
      where: { email: admin.email.toLowerCase() },
      update: {
        name: admin.name,
        passwordHash,
        role: "SUPER_ADMIN",
        isActive: true,
      },
      create: {
        organizationId: org.id,
        name: admin.name,
        email: admin.email.toLowerCase(),
        passwordHash,
        role: "SUPER_ADMIN",
        isActive: true,
      },
    });

    console.log(`✓ Super Admin created/updated: ${user.name} (${user.email})`);
  }

  // Deactivate any other users so only these 3 can log in
  const allowedEmails = SUPERADMINS.map((a) => a.email.toLowerCase());
  const deactivated = await prisma.user.updateMany({
    where: {
      email: { notIn: allowedEmails },
    },
    data: {
      isActive: false,
    },
  });

  console.log(`Deactivated ${deactivated.count} other non-superadmin accounts.`);
  console.log("Super Admin accounts setup successfully!");
}

main()
  .catch((e) => {
    console.error("Error setting up superadmins:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
