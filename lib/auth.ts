// Konfigurasi NextAuth. Setelah `npx prisma generate` & DB siap,
// sambungkan ke app/api/auth/[...nextauth]/route.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { createSupabaseAuthClient } from "@/lib/supabase";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET || "rekberin_dev_secret_key_12345678901234567890",
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.trim().toLowerCase();
        const supabase = createSupabaseAuthClient();

        // Auth aktual didelegasikan ke Supabase Auth.
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: credentials.password,
        });
        if (error || !data.user) return null;

        const dbUser = await prisma.user.findUnique({
          where: { email },
        });
        if (!dbUser) return null;

        return {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.fullName,
          role: dbUser.role,
          username: dbUser.username,
          avatarUrl: dbUser.avatarUrl,
          isVerified: dbUser.isVerified,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        // Keep the database user id available to protected API routes.
        (token as any).userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const userId = (token as any).userId ?? token.sub;
        (session.user as any).id = userId;
        (session.user as any).role = token.role;

        // Keep account identity in the session aligned with the database so
        // existing JWT sessions also receive username/verification updates.
        if (typeof userId === "string") {
          const databaseUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
              email: true,
              username: true,
              fullName: true,
              avatarUrl: true,
              role: true,
              isVerified: true,
            },
          });

          if (databaseUser) {
            session.user.email = databaseUser.email;
            session.user.name = databaseUser.fullName;
            session.user.image = databaseUser.avatarUrl;
            (session.user as any).username = databaseUser.username;
            (session.user as any).role = databaseUser.role;
            (session.user as any).isVerified = databaseUser.isVerified;
          }
        }
      }
      return session;
    },
  },
};
