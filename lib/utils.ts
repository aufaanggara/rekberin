import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export const formatCurrency = formatRupiah;

export function trustLabel(score: number) {
  if (score >= 90) return { label: "Excellent", color: "text-accent-success" };
  if (score >= 75) return { label: "Good", color: "text-accent-primary" };
  if (score >= 60) return { label: "Fair", color: "text-accent-warning" };
  return { label: "Poor", color: "text-accent-danger" };
}

export function waLink(number: string, message = "") {
  const clean = number.replace(/\D/g, "");
  return `https://wa.me/${clean}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}
