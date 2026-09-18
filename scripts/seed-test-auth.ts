import { loadEnvConfig } from "@next/env";
import { PrismaClient, Role } from "@prisma/client";
import {
  createClient,
  type SupabaseClient,
  type User as SupabaseUser,
} from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();
const applyChanges = process.argv.includes("--apply");
const password = process.env.TEST_USER_PASSWORD || "password123";

const testUsers = [
  {
    email: "buyer@test.com",
    username: "buyer_test",
    fullName: "Buyer Test",
    role: Role.USER,
  },
  {
    email: "seller@test.com",
    username: "seller_test",
    fullName: "Seller Test",
    role: Role.USER,
  },
  {
    email: "admin@rekberin.com",
    username: "admin_rekber",
    fullName: "Admin Rekber 1",
    role: Role.ADMIN,
  },
  {
    email: "superadmin@rekberin.com",
    username: "superadmin",
    fullName: "Super Admin Rekberin",
    role: Role.SUPER_ADMIN,
  },
] as const;

async function listAllAuthUsers(supabase: SupabaseClient<any, any, any>) {
  const users: SupabaseUser[] = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }
  return users;
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib tersedia.");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const [authUsers, databaseUsers] = await Promise.all([
    listAllAuthUsers(supabase),
    prisma.user.findMany({
      where: { email: { in: testUsers.map((user) => user.email) } },
      select: { email: true },
    }),
  ]);

  const authEmails = new Set(authUsers.map((user) => user.email?.toLowerCase()));
  const databaseEmails = new Set(databaseUsers.map((user) => user.email.toLowerCase()));

  if (!applyChanges) {
    for (const user of testUsers) {
      console.log(
        `${user.email}: prisma=${databaseEmails.has(user.email) ? "ready" : "missing"}, supabase=${authEmails.has(user.email) ? "ready" : "missing"}`
      );
    }
    console.log("Dry run. Jalankan `npm run auth:seed` untuk membuat/menyelaraskan akun test.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  for (const user of testUsers) {
    const dbUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
      create: {
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        password: passwordHash,
        role: user.role,
        isVerified: true,
      },
    });

    if (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) {
      await prisma.adminProfile.upsert({
        where: { userId: dbUser.id },
        update: { isActive: true },
        create: {
          userId: dbUser.id,
          bio: "Admin test Rekberin",
          fee: 1000,
          bankAccounts: [],
          activeHours: "08:00 - 22:00 WIB",
          trustScore: 95,
          totalSuccess: 0,
          isActive: true,
        },
      });
    }

    const existingAuthUser = authUsers.find(
      (authUser) => authUser.email?.toLowerCase() === user.email
    );
    if (existingAuthUser) {
      const { error } = await supabase.auth.admin.updateUserById(existingAuthUser.id, {
        password,
        email_confirm: true,
        user_metadata: { fullName: user.fullName, username: user.username },
      });
      if (error) throw error;
    } else {
      const { error } = await supabase.auth.admin.createUser({
        email: user.email,
        password,
        email_confirm: true,
        user_metadata: { fullName: user.fullName, username: user.username },
      });
      if (error) throw error;
    }
    console.log(`${user.email}: synchronized`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
