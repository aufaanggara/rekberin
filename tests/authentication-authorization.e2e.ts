import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import assert from "node:assert/strict";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const { prisma } = require("@/lib/prisma") as typeof import("@/lib/prisma");
const { createSupabaseServiceClient } = require("@/lib/supabase") as typeof import("@/lib/supabase");

class CookieJar {
  private readonly cookies = new Map<string, string>();

  absorb(response: Response) {
    const headerApi = response.headers as Headers & { getSetCookie?: () => string[] };
    const headers = headerApi.getSetCookie?.() ?? [response.headers.get("set-cookie") ?? ""];
    for (const header of headers) {
      const pattern = /(?:^|,\s*)((?:__Secure-)?next-auth\.[^=;,)\s]+)=([^;,]*)/g;
      for (const match of header.matchAll(pattern)) this.cookies.set(match[1], match[2]);
    }
  }

  header() {
    return [...this.cookies.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
  }
}

async function request(baseUrl: string, jar: CookieJar, pathname: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const cookie = jar.header();
  if (cookie) headers.set("cookie", cookie);
  const response = await fetch(`${baseUrl}${pathname}`, {
    ...init,
    headers,
    redirect: init.redirect ?? "manual",
  });
  jar.absorb(response);
  return response;
}

async function login(baseUrl: string, email: string, password: string, expectSuccess = true) {
  const jar = new CookieJar();
  const csrfResponse = await request(baseUrl, jar, "/api/auth/csrf");
  const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };
  const callbackResponse = await request(baseUrl, jar, "/api/auth/callback/credentials", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Auth-Return-Redirect": "1",
    },
    body: new URLSearchParams({ csrfToken, email, password, callbackUrl: `${baseUrl}/`, json: "true" }),
  });
  if (expectSuccess) {
    assert.ok([200, 302].includes(callbackResponse.status));
  } else {
    assert.ok(![200, 302].includes(callbackResponse.status));
  }
  const sessionResponse = await request(baseUrl, jar, "/api/auth/session");
  return { jar, session: (await sessionResponse.json()) as { user?: { id?: string; role?: string; email?: string } } };
}

async function waitForServer(baseUrl: string, server: ChildProcess) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error("Next.js berhenti sebelum siap.");
    try {
      if ((await fetch(`${baseUrl}/api/listings`)).ok) return;
    } catch {
      // Server masih memulai.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Next.js tidak siap dalam 60 detik.");
}

async function main() {
  const port = 34_000 + Math.floor(Math.random() * 1_000);
  const baseUrl = `http://127.0.0.1:${port}`;
  const nextCli = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
  const server = spawn(process.execPath, [nextCli, "dev", "-p", String(port)], {
    cwd: process.cwd(),
    env: { ...process.env, NEXTAUTH_URL: baseUrl, NEXT_PUBLIC_SITE_URL: baseUrl },
    stdio: "ignore",
    windowsHide: true,
  });

  const email = `dev06-${Date.now()}@test.com`;
  const username = `dev06_${Date.now()}`;
  const password = "password123";
  const supabase = createSupabaseServiceClient();

  try {
    await waitForServer(baseUrl, server);

    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: "DEV 06 User", username, email, password, role: "ADMIN" }),
    });
    assert.equal(registerResponse.status, 201);
    const registered = (await registerResponse.json()) as { user: { role: string } };
    assert.equal(registered.user.role, "USER");

    const duplicateEmailResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: "Duplicate", username: `${username}_email`, email, password }),
    });
    assert.equal(duplicateEmailResponse.status, 409);

    const duplicateUsernameResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: "Duplicate", username, email: `other-${email}`, password }),
    });
    assert.equal(duplicateUsernameResponse.status, 409);

    const wrongPassword = await login(baseUrl, email, "wrong-password", false);
    assert.equal(wrongPassword.session.user, undefined);

    const user = await login(baseUrl, email, password);
    assert.equal(user.session.user?.email, email);
    assert.ok(user.session.user?.id);
    assert.equal(user.session.user?.role, "USER");

    const anonymousTransactions = await fetch(`${baseUrl}/api/transactions`);
    assert.equal(anonymousTransactions.status, 401);

    const anonymousAdminPage = await fetch(`${baseUrl}/admin`, { redirect: "manual" });
    assert.equal(anonymousAdminPage.status, 307);
    assert.equal(new URL(anonymousAdminPage.headers.get("location") ?? "", baseUrl).pathname, "/login");

    const userAdminPage = await request(baseUrl, user.jar, "/admin");
    assert.equal(userAdminPage.status, 307);
    assert.equal(
      new URL(userAdminPage.headers.get("location") ?? "", baseUrl).pathname,
      "/unauthorized"
    );

    const admin = await login(baseUrl, "admin@rekberin.com", password);
    assert.equal(admin.session.user?.role, "ADMIN");
    const adminPage = await request(baseUrl, admin.jar, "/admin");
    assert.equal(adminPage.status, 200);

    const superAdmin = await login(baseUrl, "superadmin@rekberin.com", password);
    assert.equal(superAdmin.session.user?.role, "SUPER_ADMIN");
    const superAdminPage = await request(baseUrl, superAdmin.jar, "/admin");
    assert.equal(superAdminPage.status, 200);

    const adminAsBuyer = await request(baseUrl, admin.jar, "/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: "missing", adminId: "missing" }),
    });
    assert.equal(adminAsBuyer.status, 403);

    const logoutCsrfResponse = await request(baseUrl, user.jar, "/api/auth/csrf");
    const { csrfToken: logoutCsrfToken } = (await logoutCsrfResponse.json()) as { csrfToken: string };
    const logoutResponse = await request(baseUrl, user.jar, "/api/auth/signout", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ csrfToken: logoutCsrfToken, callbackUrl: `${baseUrl}/` }),
    });
    assert.ok([200, 302].includes(logoutResponse.status));
    const loggedOutSession = await request(baseUrl, user.jar, "/api/auth/session");
    assert.equal((await loggedOutSession.json()).user, undefined);

    console.log("DEV-06 acceptance passed: register, duplicate guards, login/session, anonymous guard, RBAC, and admin transaction guard");
    console.log("DEV-06 acceptance not covered: listing ownership mutation and SUPER_ADMIN role-management endpoint");
  } finally {
    const authUsers = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const createdAuthUser = authUsers.data.users.find((candidate) => candidate.email === email);
    if (createdAuthUser) await supabase.auth.admin.deleteUser(createdAuthUser.id);
    await prisma.user.deleteMany({ where: { email: { in: [email, `other-${email}`] } } });
    server.kill();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});