import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import ws from "ws";

const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "ChangeMe123!";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRole) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRole, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  realtime: {
    transport: ws,
  },
});

const prisma = new PrismaClient();

async function seed() {
  console.log("🚀 Starting admin seed...");

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
  console.log(`🔑 Password hash generated (bcrypt, 12 rounds)`);

  let authUserId = null;

  try {
    const { data: existingAuth, error: lookupError } = await supabase.auth.admin.getUserByEmail(ADMIN_EMAIL);
    if (!lookupError && existingAuth?.user) {
      authUserId = existingAuth.user.id;
      console.log(`✅ Admin auth user already exists: ${authUserId}`);
    }
  } catch {
    console.log("ℹ️  Admin auth user not found, will create...");
  }

  if (!authUserId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { name: "Admin" },
    });

    if (error) {
      console.error(`❌ Failed to create auth user: ${error.message}`);
      process.exit(1);
    }

    authUserId = data.user.id;
    console.log(`✅ Admin auth user created: ${authUserId}`);
  }

  let dbUser = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (dbUser) {
    dbUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        supabaseId: authUserId,
        role: "ADMIN",
        name: "Admin",
        isActive: true,
      },
    });
    console.log(`✅ Admin DB user updated: ${dbUser.id}`);
  } else {
    dbUser = await prisma.user.create({
      data: {
        supabaseId: authUserId,
        email: ADMIN_EMAIL,
        name: "Admin",
        role: "ADMIN",
        isActive: true,
      },
    });
    console.log(`✅ Admin DB user created: ${dbUser.id}`);
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Admin account ready!");
  console.log("  Email:    admin@example.com");
  console.log("  Password: ChangeMe123!");
  console.log("  Role:     ADMIN");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

seed()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
