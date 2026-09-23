export const MIDTRANS_QRIS_STATUSES = [
  "pending",
  "settlement",
  "expire",
  "deny",
  "cancel",
  "failure",
] as const;

export type MidtransQrisStatus = (typeof MIDTRANS_QRIS_STATUSES)[number];
export type RekberPaymentStatus = Uppercase<MidtransQrisStatus>;

export const MIDTRANS_QRIS_EXPIRY_MINUTES = 15;

const MAX_POSTGRES_INTEGER = 2_147_483_647;

export class PaymentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentValidationError";
  }
}

export function calculatePaymentAmount(input: {
  price: number;
  platformFee: number;
  adminFee: number;
}) {
  const values = [input.price, input.platformFee, input.adminFee];

  if (!values.every((value) => Number.isSafeInteger(value))) {
    throw new PaymentValidationError("Nominal transaksi harus berupa Rupiah bilangan bulat.");
  }
  if (input.price <= 0 || input.platformFee < 0 || input.adminFee < 0) {
    throw new PaymentValidationError("Nominal transaksi tidak valid.");
  }

  const amount = input.price + input.platformFee + input.adminFee;
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > MAX_POSTGRES_INTEGER) {
    throw new PaymentValidationError("Total pembayaran berada di luar batas yang didukung.");
  }

  return amount;
}

/** A stable order id is essential for recovery after an uncertain provider timeout. */
export function createPaymentOrderId(transactionId: string) {
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(transactionId)) {
    throw new PaymentValidationError("Identitas transaksi tidak valid untuk payment provider.");
  }

  const orderId = `rekberin-qris-${transactionId}`;
  if (orderId.length > 100) {
    throw new PaymentValidationError("Identitas pembayaran terlalu panjang.");
  }

  return orderId;
}

export function parseMidtransAmount(value: unknown) {
  const raw = typeof value === "number" ? String(value) : value;
  if (typeof raw !== "string" || !/^\d+(?:\.0{1,2})?$/.test(raw)) {
    throw new PaymentValidationError("Nominal dari payment provider tidak valid.");
  }

  const integerPart = raw.split(".")[0];
  const amount = Number(integerPart);
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > MAX_POSTGRES_INTEGER) {
    throw new PaymentValidationError("Nominal dari payment provider berada di luar batas.");
  }

  return amount;
}

export function parseMidtransTimestamp(value: string | null | undefined) {
  if (!value) return null;

  const jakartaTimestamp = value.match(
    /^(\d{4}-\d{2}-\d{2})\s(\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?)$/
  );
  const timestamp = jakartaTimestamp
    ? Date.parse(`${jakartaTimestamp[1]}T${jakartaTimestamp[2]}+07:00`)
    : Date.parse(value);

  if (Number.isNaN(timestamp)) {
    throw new PaymentValidationError("Waktu dari payment provider tidak valid.");
  }

  return new Date(timestamp);
}

export function isMidtransQrisStatus(value: string): value is MidtransQrisStatus {
  return (MIDTRANS_QRIS_STATUSES as readonly string[]).includes(value);
}

export function mapMidtransStatus(value: string): RekberPaymentStatus | null {
  if (!isMidtransQrisStatus(value)) return null;
  return value.toUpperCase() as RekberPaymentStatus;
}

export function isTerminalPaymentStatus(status: RekberPaymentStatus) {
  return status !== "PENDING";
}
