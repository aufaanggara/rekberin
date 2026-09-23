export interface MidtransConfig {
  readonly environment: "sandbox";
  readonly serverKey: string;
  readonly notificationUrl: string;
  readonly qrisAcquirer: "gopay";
  readonly qrisExpiryMinutes: 15;
  readonly apiBaseUrl: "https://api.sandbox.midtrans.com";
}

export class MidtransConfigurationError extends Error {
  constructor(message = "Konfigurasi QRIS Sandbox belum lengkap atau tidak valid.") {
    super(message);
    this.name = "MidtransConfigurationError";
  }
}

type EnvironmentValues = Record<string, string | undefined>;

function requiredEnvironmentValue(env: EnvironmentValues, name: string) {
  const value = env[name]?.trim();
  if (!value) {
    throw new MidtransConfigurationError(`Konfigurasi ${name} belum tersedia.`);
  }
  return value;
}

/**
 * Reads configuration only when a server-side QRIS operation needs it. The
 * returned object is intentionally never imported by client components.
 */
export function readMidtransConfig(env: EnvironmentValues = process.env): MidtransConfig {
  if (env.MIDTRANS_ENVIRONMENT?.trim() !== "sandbox") {
    throw new MidtransConfigurationError("Issue ini hanya mengizinkan Midtrans Sandbox.");
  }

  const serverKey = requiredEnvironmentValue(env, "MIDTRANS_SERVER_KEY");
  const notificationUrl = requiredEnvironmentValue(env, "MIDTRANS_NOTIFICATION_URL");
  let parsedNotificationUrl: URL;
  try {
    parsedNotificationUrl = new URL(notificationUrl);
  } catch {
    throw new MidtransConfigurationError("MIDTRANS_NOTIFICATION_URL bukan URL yang valid.");
  }
  if (parsedNotificationUrl.protocol !== "https:" || !parsedNotificationUrl.hostname) {
    throw new MidtransConfigurationError(
      "MIDTRANS_NOTIFICATION_URL harus memakai HTTPS dan dapat diakses publik."
    );
  }

  if (env.MIDTRANS_QRIS_ACQUIRER?.trim().toLowerCase() !== "gopay") {
    throw new MidtransConfigurationError("QRIS Sandbox v1 hanya mendukung acquirer gopay.");
  }
  if (env.MIDTRANS_QRIS_EXPIRY_MINUTES?.trim() !== "15") {
    throw new MidtransConfigurationError("Batas waktu QRIS Sandbox harus 15 menit.");
  }

  return {
    environment: "sandbox",
    serverKey,
    notificationUrl: parsedNotificationUrl.toString(),
    qrisAcquirer: "gopay",
    qrisExpiryMinutes: 15,
    apiBaseUrl: "https://api.sandbox.midtrans.com",
  };
}
