import { z } from "zod";
import {
  isMidtransQrisStatus,
  MIDTRANS_QRIS_EXPIRY_MINUTES,
  parseMidtransAmount,
  parseMidtransTimestamp,
  type MidtransQrisStatus,
} from "@/lib/payments/payment-domain";
import {
  readMidtransConfig,
  type MidtransConfig,
} from "@/lib/payments/midtrans-config";

const MIDTRANS_TIMEOUT_MS = 10_000;
// Midtrans' Sandbox charge response may legitimately point at either the
// Sandbox API host or its public QR image host. Keep the allowlist exact.
const MIDTRANS_QR_HOSTS = new Set(["api.sandbox.midtrans.com", "api.midtrans.com"]);

const midtransResponseSchema = z
  .object({
    order_id: z.string().min(1).max(100),
    transaction_id: z.string().min(1).max(120).optional(),
    gross_amount: z.union([z.string(), z.number()]),
    currency: z.string().min(1).max(10).optional(),
    payment_type: z.string().min(1).max(40).optional(),
    acquirer: z.string().min(1).max(40).optional(),
    transaction_status: z.string().min(1).max(40),
    transaction_time: z.string().min(1).max(64).optional(),
    fraud_status: z.string().min(1).max(40).optional(),
    expiry_time: z.string().min(1).max(64).optional(),
    settlement_time: z.string().min(1).max(64).optional(),
    actions: z
      .array(
        z
          .object({
            name: z.string().min(1).max(80),
            method: z.string().min(1).max(20).optional(),
            url: z.string().url().max(2_000),
          })
          .passthrough()
      )
      .optional(),
  })
  .passthrough();

export interface MidtransTransaction {
  orderId: string;
  transactionId: string | null;
  amount: number;
  currency: "IDR";
  paymentType: "qris";
  acquirer: "gopay" | null;
  transactionStatus: MidtransQrisStatus;
  qrCodeUrl: string | null;
  expiresAt: Date | null;
  paidAt: Date | null;
}

export interface MidtransGateway {
  chargeQris(input: {
    orderId: string;
    amount: number;
    itemName: string;
  }): Promise<MidtransTransaction>;
  getTransactionStatus(orderId: string): Promise<MidtransTransaction | null>;
}

export class MidtransUnavailableError extends Error {
  constructor(message = "Layanan QRIS sedang tidak dapat dihubungi. Silakan coba sinkronisasi lagi.") {
    super(message);
    this.name = "MidtransUnavailableError";
  }
}

export class MidtransResponseError extends Error {
  constructor(message = "Respons QRIS dari provider tidak dapat diverifikasi.") {
    super(message);
    this.name = "MidtransResponseError";
  }
}

export function isSafeMidtransQrCodeUrl(value: string) {
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      !MIDTRANS_QR_HOSTS.has(url.hostname.toLowerCase())
    ) {
      return false;
    }

    return /^\/(?:v2\/(?:qr|qris)|v4\/qris)\/[^/]+\/qr-code$/.test(url.pathname);
  } catch {
    return false;
  }
}

function selectQrCodeUrl(
  actions: Array<{ name: string; url: string }> | undefined,
  requireQrCode: boolean
) {
  const preferredActions = ["generate-qr-code-v2", "generate-qr-code"];
  const action = preferredActions
    .map((name) => actions?.find((candidate) => candidate.name === name))
    .find((candidate) => candidate && isSafeMidtransQrCodeUrl(candidate.url));

  if (action) return action.url;
  if (requireQrCode) {
    throw new MidtransResponseError("Provider tidak mengembalikan QRIS yang aman untuk ditampilkan.");
  }
  return null;
}

export function parseMidtransTransactionResponse(
  payload: unknown,
  options: { requireQrCode?: boolean } = {}
): MidtransTransaction {
  const parsed = midtransResponseSchema.safeParse(payload);
  if (!parsed.success || !isMidtransQrisStatus(parsed.data?.transaction_status ?? "")) {
    throw new MidtransResponseError();
  }

  const currency = parsed.data.currency?.toUpperCase();
  const paymentType = parsed.data.payment_type?.toLowerCase();
  const acquirer = parsed.data.acquirer?.toLowerCase();
  if (currency !== "IDR" || paymentType !== "qris" || (acquirer && acquirer !== "gopay")) {
    throw new MidtransResponseError("Respons provider tidak sesuai konfigurasi QRIS Sandbox.");
  }
  if (
    parsed.data.transaction_status === "settlement" &&
    parsed.data.fraud_status &&
    parsed.data.fraud_status !== "accept"
  ) {
    throw new MidtransResponseError("Status settlement QRIS tidak dapat diverifikasi.");
  }

  try {
    const transactionTime = parseMidtransTimestamp(parsed.data.transaction_time);
    const explicitExpiry = parseMidtransTimestamp(parsed.data.expiry_time);
    const expiresAt = explicitExpiry ?? (transactionTime
      ? new Date(transactionTime.getTime() + MIDTRANS_QRIS_EXPIRY_MINUTES * 60_000)
      : null);

    return {
      orderId: parsed.data.order_id,
      transactionId: parsed.data.transaction_id ?? null,
      amount: parseMidtransAmount(parsed.data.gross_amount),
      currency: "IDR",
      paymentType: "qris",
      acquirer: acquirer === "gopay" ? "gopay" : null,
      transactionStatus: parsed.data.transaction_status as MidtransQrisStatus,
      qrCodeUrl: selectQrCodeUrl(parsed.data.actions, options.requireQrCode === true),
      expiresAt,
      paidAt: parseMidtransTimestamp(parsed.data.settlement_time),
    };
  } catch (error) {
    if (error instanceof MidtransResponseError) throw error;
    throw new MidtransResponseError();
  }
}

export function classifyMidtransHttpStatus(status: number) {
  return status >= 500 || status === 408 || status === 429 ? "unavailable" : "response-error";
}

function toBasicAuthHeader(serverKey: string) {
  return `Basic ${Buffer.from(`${serverKey}:`, "utf8").toString("base64")}`;
}

class MidtransCoreGateway implements MidtransGateway {
  constructor(
    private readonly config: MidtransConfig,
    private readonly fetchImpl: typeof fetch = fetch
  ) {}

  async chargeQris(input: {
    orderId: string;
    amount: number;
    itemName: string;
  }) {

    const payload = await this.requestJson("/v2/charge", {
      method: "POST",
      body: JSON.stringify({
        payment_type: "qris",
        transaction_details: {
          order_id: input.orderId,
          gross_amount: input.amount,
        },
        item_details: [
          {
            id: `transaction-${input.orderId}`,
            price: input.amount,
            quantity: 1,
            name: input.itemName.slice(0, 50) || "Pembayaran Rekberin",
          },
        ],
        qris: {
          acquirer: this.config.qrisAcquirer,
        },
        custom_expiry: {
          expiry_duration: this.config.qrisExpiryMinutes,
          unit: "minute",
        },
      }),
    });

    const parsed = parseMidtransTransactionResponse(payload, {
      requireQrCode: true,
    });
    console.log("QRIS URL:", parsed.qrCodeUrl);
    return parsed;
  }

  async getTransactionStatus(orderId: string) {
    const payload = await this.requestJson(
      `/v2/${encodeURIComponent(orderId)}/status`,
      {
        method: "GET",
      },
      {
        allowNotFound: true,
      }
    );

    if (!payload) {
      return null;
    }

    if (
      typeof payload === "object" &&
      payload !== null &&
      "status_code" in payload &&
      (payload as { status_code?: unknown }).status_code === "404"
    ) {
      return null;
    }

    return parseMidtransTransactionResponse(payload, {
      requireQrCode: false,
    });
  }

  private async requestJson(
    path: string,
    init: RequestInit,
    options: { allowNotFound?: boolean } = {}
  ): Promise<unknown | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), MIDTRANS_TIMEOUT_MS);
    let response: Response;

    try {
      response = await this.fetchImpl(`${this.config.apiBaseUrl}${path}`, {
        ...init,
        headers: {
          Accept: "application/json",
          Authorization: toBasicAuthHeader(this.config.serverKey),
          "Content-Type": "application/json",
          "X-Override-Notification": this.config.notificationUrl,
          ...init.headers,
        },
        cache: "no-store",
        signal: controller.signal,
      });
    } catch {
      throw new MidtransUnavailableError();
    } finally {
      clearTimeout(timeout);
    }

    if (options.allowNotFound && response.status === 404) {
      return null;
    }
    if (!response.ok) {
      if (classifyMidtransHttpStatus(response.status) === "unavailable") {
        throw new MidtransUnavailableError();
      }
      throw new MidtransResponseError("Permintaan QRIS ditolak atau tidak dapat diverifikasi.");
    }

    try {
      return await response.json();
    } catch {
      throw new MidtransResponseError();
    }
  }
}

export function createMidtransGateway(
  config = readMidtransConfig(),
  fetchImpl: typeof fetch = fetch
): MidtransGateway {
  return new MidtransCoreGateway(config, fetchImpl);
}
