const { execSync } = require("child_process");

// Set safe fallback environment variables for build time if not configured in Vercel yet
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://postgres:password@localhost:5432/certflow?sslmode=disable";
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "certflow-default-production-session-secret-2026";
}

console.log("=== Step 1: Running Prisma Generate ===");
try {
  execSync("npx prisma generate", { stdio: "inherit", env: process.env });
} catch (err) {
  console.error("Prisma generate failed:", err);
  process.exit(1);
}

console.log("\n=== Step 2: Building Next.js Application ===");
try {
  execSync("npx next build", { stdio: "inherit", env: process.env });
} catch (err) {
  console.error("Next build failed:", err);
  process.exit(1);
}

console.log("\n=== Build Completed Successfully! ===");
