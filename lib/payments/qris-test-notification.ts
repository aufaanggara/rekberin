const NTFY_TOPIC_URL = "https://ntfy.sh/codex-completion-notification";

/** Send a newly available sandbox QRIS link to the test device only when opted in. */
export async function sendTestQrisNotification(
  qrCodeUrl: string,
  options: { enabled?: boolean; environment?: string; fetchImpl?: typeof fetch } = {}
) {
  if (!(options.enabled ?? process.env.MIDTRANS_QRIS_NTFY_TEST === "true")) return false;
  if ((options.environment ?? process.env.MIDTRANS_ENVIRONMENT) !== "sandbox") return false;

  const url = new URL(qrCodeUrl);
  if (url.protocol !== "https:" || !["api.sandbox.midtrans.com", "api.midtrans.com"].includes(url.hostname)) return false;

  const response = await (options.fetchImpl ?? fetch)(NTFY_TOPIC_URL, {
    method: "POST",
    body: `Midtrans QRIS: ${qrCodeUrl}`,
    signal: AbortSignal.timeout(3_000),
  });
  if (!response.ok) throw new Error(`ntfy returned HTTP ${response.status}`);
  return true;
}
