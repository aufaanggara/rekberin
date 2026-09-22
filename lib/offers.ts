import { PriceOffer } from "@/types";

// In-memory persistent offer store during runtime with dummy initial values
let offersStore: PriceOffer[] = [
  {
    id: "off_1",
    listingId: "list_1",
    buyerId: "usr_buyer_1",
    buyerName: "Rian Gaming",
    sellerId: "usr_seller_1",
    originalPrice: 450000,
    offeredPrice: 400000,
    notes: "Nego tipis ya gan, langsung gas rekber.",
    status: "ACCEPTED",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

export function getOffersByListing(listingId: string): PriceOffer[] {
  return offersStore.filter((o) => o.listingId === listingId);
}

export function getOffersByBuyer(buyerId: string): PriceOffer[] {
  return offersStore.filter((o) => o.buyerId === buyerId);
}

export function getOffersBySeller(sellerId: string): PriceOffer[] {
  return offersStore.filter((o) => o.sellerId === sellerId);
}

export function createOffer(params: {
  listingId: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  originalPrice: number;
  offeredPrice: number;
  notes?: string;
}): PriceOffer {
  const newOffer: PriceOffer = {
    id: `off_${Date.now()}`,
    listingId: params.listingId,
    buyerId: params.buyerId,
    buyerName: params.buyerName,
    sellerId: params.sellerId,
    originalPrice: params.originalPrice,
    offeredPrice: params.offeredPrice,
    notes: params.notes,
    status: "PENDING",
    createdAt: new Date().toISOString(),
  };
  offersStore.unshift(newOffer);
  return newOffer;
}

export function updateOfferStatus(
  offerId: string,
  status: "ACCEPTED" | "REJECTED"
): PriceOffer | null {
  const offer = offersStore.find((o) => o.id === offerId);
  if (!offer) return null;

  offer.status = status;
  offer.updatedAt = new Date().toISOString();

  // If accepted, reject other pending offers on the same listing
  if (status === "ACCEPTED") {
    offersStore.forEach((o) => {
      if (o.listingId === offer.listingId && o.id !== offer.id && o.status === "PENDING") {
        o.status = "REJECTED";
      }
    });
  }

  return offer;
}
