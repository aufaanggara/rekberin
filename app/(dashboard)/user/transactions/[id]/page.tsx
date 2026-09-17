import { notFound } from "next/navigation";
import { dummyTransactions } from "@/data/dummy";
import { BuyerTransactionView } from "@/components/dashboard/BuyerTransactionView";
import { SellerTransactionView } from "@/components/dashboard/SellerTransactionView";

export default function UserTransactionDetailPage({ params }: { params: { id: string } }) {
  const t = dummyTransactions.find((tx) => tx.id === params.id);
  if (!t) return notFound();

  // In demo session: "Dimas Anggara" is the default user context.
  // If transaction seller is Dimas, or if URL has context or seller username matches:
  const isSeller = t.listing.seller.username === "Dimas Anggara";

  if (isSeller) {
    return <SellerTransactionView initialTransaction={t} />;
  }

  return <BuyerTransactionView initialTransaction={t} />;
}
