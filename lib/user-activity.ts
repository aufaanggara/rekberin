export type ActivityRole = "buyer" | "seller";

type NegotiationForActivity = {
  buyerId: string;
  sellerId: string;
  listing: { status: string };
  transaction: { id: string } | null;
};

type TransactionForActivity = {
  buyerId: string;
  sellerId: string;
  status: string;
};

const finishedStatuses = new Set(["COMPLETED", "CANCELLED"]);

export function selectUserActivity<N extends NegotiationForActivity, T extends TransactionForActivity>(
  userId: string,
  role: ActivityRole,
  negotiations: N[],
  transactions: T[]
) {
  const belongsToRole = (item: { buyerId: string; sellerId: string }) =>
    role === "buyer" ? item.buyerId === userId : item.sellerId === userId;

  return {
    negotiations: negotiations.filter((item) => belongsToRole(item) && !item.transaction && item.listing.status === "AVAILABLE"),
    ongoingTransactions: transactions.filter((item) => belongsToRole(item) && !finishedStatuses.has(item.status)),
    history: transactions.filter((item) => belongsToRole(item) && finishedStatuses.has(item.status)),
  };
}
