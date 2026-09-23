import { OtpLogEntry, AccountCredentials } from "@/types";

interface HandoverState {
  transactionId: string;
  credentials?: AccountCredentials;
  otpLogs: OtpLogEntry[];
  sellerLastActiveAt?: string;
  handoverStartedAt?: string;
}

const handoverStore = new Map<string, HandoverState>();

export function getHandoverState(transactionId: string): HandoverState {
  if (!handoverStore.has(transactionId)) {
    handoverStore.set(transactionId, {
      transactionId,
      otpLogs: [],
    });
  }
  return handoverStore.get(transactionId)!;
}

export function saveCredentials(
  transactionId: string,
  credentials: AccountCredentials
): HandoverState {
  const state = getHandoverState(transactionId);
  state.credentials = credentials;
  state.sellerLastActiveAt = new Date().toISOString();
  if (!state.handoverStartedAt) {
    state.handoverStartedAt = new Date().toISOString();
  }
  return state;
}

export function addOtpLog(
  transactionId: string,
  entry: Omit<OtpLogEntry, "id" | "timestamp">
): OtpLogEntry {
  const state = getHandoverState(transactionId);
  const log: OtpLogEntry = {
    ...entry,
    id: `otp_${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
  state.otpLogs.push(log);
  if (entry.actorRole === "SELLER") {
    state.sellerLastActiveAt = new Date().toISOString();
  }
  return log;
}
