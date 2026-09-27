export const HANDOVER_WINDOW_MS = 2 * 60 * 60 * 1000;

export function handoverDeadline(startedAt: Date) {
  return new Date(startedAt.getTime() + HANDOVER_WINDOW_MS);
}
