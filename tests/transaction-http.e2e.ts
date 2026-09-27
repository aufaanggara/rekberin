import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import assert from "node:assert/strict";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const { prisma } = require("@/lib/prisma") as typeof import("@/lib/prisma");

class CookieJar {
  private readonly cookies = new Map<string, string>();

  absorb(response: Response) {
    const headerApi = response.headers as Headers & { getSetCookie?: () => string[] };
    const setCookies = headerApi.getSetCookie?.() ?? [response.headers.get("set-cookie") ?? ""];
    for (const header of setCookies) {
      const pattern = /(?:^|,\s*)((?:__Secure-)?next-auth\.[^=;,\s]+)=([^;,]*)/g;
      for (const match of header.matchAll(pattern)) {
        this.cookies.set(match[1], match[2]);
      }
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

async function login(baseUrl: string, email: string, password: string) {
  const jar = new CookieJar();
  const csrfResponse = await request(baseUrl, jar, "/api/auth/csrf");
  assert.equal(csrfResponse.status, 200);
  const csrfPayload = (await csrfResponse.json()) as { csrfToken: string };

  const body = new URLSearchParams({
    csrfToken: csrfPayload.csrfToken,
    email,
    password,
    callbackUrl: `${baseUrl}/user/transactions`,
    json: "true",
  });
  const callbackResponse = await request(
    baseUrl,
    jar,
    "/api/auth/callback/credentials",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Auth-Return-Redirect": "1",
      },
      body,
    }
  );
  assert.ok([200, 302].includes(callbackResponse.status));

  const sessionResponse = await request(baseUrl, jar, "/api/auth/session");
  assert.equal(sessionResponse.status, 200);
  const session = (await sessionResponse.json()) as {
    user?: { id?: string; role?: string; email?: string };
  };
  assert.equal(session.user?.email, email);
  assert.ok(session.user?.id);
  return { jar, session };
}

async function waitForServer(baseUrl: string, server: ChildProcess, logs: string[]) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Next.js berhenti sebelum siap.\n${logs.join("")}`);
    }
    try {
      const response = await fetch(`${baseUrl}/api/listings`);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Next.js tidak siap dalam 60 detik.\n${logs.join("")}`);
}

async function main() {
  const port = 33_000 + Math.floor(Math.random() * 1_000);
  const baseUrl = `http://127.0.0.1:${port}`;
  const nextCli = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
  const logs: string[] = [];
  const server = spawn(process.execPath, [nextCli, "dev", "-p", String(port)], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NEXTAUTH_URL: baseUrl,
      NEXT_PUBLIC_SITE_URL: baseUrl,
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  server.stdout?.on("data", (chunk) => logs.push(String(chunk)));
  server.stderr?.on("data", (chunk) => logs.push(String(chunk)));

  let listingId: string | null = null;
  let negotiationId: string | null = null;
  let transactionId: string | null = null;

  try {
    await waitForServer(baseUrl, server, logs);

    const seller = await login(baseUrl, "seller@test.com", "password123");
    assert.equal(seller.session.user?.role, "USER");
    const listingResponse = await request(baseUrl, seller.jar, "/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `E2E Listing ${Date.now()}`,
        game: "eFootball",
        price: 275000,
        description: "Listing sementara untuk pengujian alur transaksi end-to-end.",
        details: {
          overall: 91,
          league: "Division 1",
          coins: 500,
          gp: 10000,
          players: ["E2E Player"],
          notes: "Fixture akan dihapus otomatis.",
          loginMethod: "Konami ID",
          isNominus: true,
          hasWarranty: true,
          region: "Indonesia",
        },
        images: ["/screenshots/efootball_89.jpg"],
      }),
    });
    assert.equal(listingResponse.status, 201);
    const listingPayload = (await listingResponse.json()) as { listing: { id: string } };
    listingId = listingPayload.listing.id;

    const buyer = await login(baseUrl, "buyer@test.com", "password123");
    const negotiationResponse = await request(baseUrl, buyer.jar, "/api/negotiations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });
    assert.equal(negotiationResponse.status, 200);
    const negotiationPayload = (await negotiationResponse.json()) as { negotiation: { id: string } };
    negotiationId = negotiationPayload.negotiation.id;
    const buyerMessage = await request(baseUrl, buyer.jar, `/api/negotiations/${negotiationId}/messages`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: "Halo, akun masih tersedia?" }),
    });
    assert.equal(buyerMessage.status, 201);
    const offerResponse = await request(baseUrl, buyer.jar, `/api/negotiations/${negotiationId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "OFFER", price: 240000 }),
    });
    assert.equal(offerResponse.status, 200);
    const offer = (await offerResponse.json()) as { negotiation: { version: number } };
    const acceptanceResponse = await request(baseUrl, seller.jar, `/api/negotiations/${negotiationId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ACCEPT", version: offer.negotiation.version }),
    });
    assert.equal(acceptanceResponse.status, 200);
    const checkoutResponse = await request(baseUrl, buyer.jar, `/api/negotiations/${negotiationId}/checkout`, { method: "POST" });
    assert.equal(checkoutResponse.status, 200);
    transactionId = ((await checkoutResponse.json()) as { transactionId: string }).transactionId;
    const transactionResponse = await request(baseUrl, buyer.jar, `/api/transactions/${transactionId}`);
    assert.equal(transactionResponse.status, 200);
    const transactionPayload = (await transactionResponse.json()) as {
      transaction: {
        id: string;
        price: number;
        status: string;
        listing: { status: string };
        buyerId: string;
        sellerId: string;
        adminId: string;
      };
    };
    assert.equal(transactionPayload.transaction.id, transactionId);
    assert.equal(transactionPayload.transaction.price, 240000);
    assert.equal(transactionPayload.transaction.status, "PENDING_PAYMENT");
    assert.equal(transactionPayload.transaction.listing.status, "IN_TRANSACTION");

    const listingAfterResponse = await request(baseUrl, buyer.jar, `/api/listings/${listingId}`);
    assert.equal(listingAfterResponse.status, 200);
    const listingAfter = (await listingAfterResponse.json()) as { listing: { status: string } };
    assert.equal(listingAfter.listing.status, "IN_TRANSACTION");

    const buyerTransaction = await request(
      baseUrl,
      buyer.jar,
      `/api/transactions/${transactionId}`
    );
    assert.equal(buyerTransaction.status, 200);
    const reopenedTransaction = (await buyerTransaction.json()) as {
      transaction: { id: string; status: string };
    };
    assert.equal(reopenedTransaction.transaction.id, transactionId);
    assert.equal(reopenedTransaction.transaction.status, "PENDING_PAYMENT");

    const sellerTransactions = await request(baseUrl, seller.jar, "/api/transactions");
    assert.equal(sellerTransactions.status, 200);
    assert.match(await sellerTransactions.text(), new RegExp(transactionId));

    const admin = await login(baseUrl, "admin@rekberin.com", "password123");
    assert.equal(admin.session.user?.role, "ADMIN");
    const adminTransaction = await request(
      baseUrl,
      admin.jar,
      `/api/transactions/${transactionId}`
    );
    assert.equal(adminTransaction.status, 200);
    const adminChatBeforeReport = await request(baseUrl, admin.jar, `/api/transactions/${transactionId}/messages`);
    assert.equal(adminChatBeforeReport.status, 403);

    const unrelated = await login(baseUrl, "superadmin@rekberin.com", "password123");
    const unrelatedTransaction = await request(
      baseUrl,
      unrelated.jar,
      `/api/transactions/${transactionId}`
    );
    assert.equal(unrelatedTransaction.status, 403);

    const buyerPage = await request(
      baseUrl,
      buyer.jar,
      `/user/transactions/${transactionId}`
    );
    assert.equal(buyerPage.status, 200);
    const adminPage = await request(
      baseUrl,
      admin.jar,
      `/admin/transactions/${transactionId}`
    );
    assert.equal(adminPage.status, 200);

    const migratedChat = await request(baseUrl, seller.jar, `/api/transactions/${transactionId}/messages`);
    assert.equal(migratedChat.status, 200);
    assert.match(await migratedChat.text(), /Halo, akun masih tersedia/);
    console.log(`E2E passed: listing ${listingId} -> accepted offer -> transaction ${transactionId}`);
  } finally {
    if (transactionId) {
      await prisma.chatMessage.deleteMany({ where: { transactionId } });
      await prisma.transaction.deleteMany({ where: { id: transactionId } });
    }
    if (negotiationId) await prisma.negotiation.deleteMany({ where: { id: negotiationId } });
    if (listingId) {
      await prisma.listing.deleteMany({ where: { id: listingId } });
    }
    server.kill();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
