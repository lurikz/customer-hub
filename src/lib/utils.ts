import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getWhatsAppLink = (phone: string | null) => {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  // If it's a Brazilian number and doesn't have the country code, add 55
  const formatted = (cleaned.length === 10 || cleaned.length === 11) ? `55${cleaned}` : cleaned;
  return `https://wa.me/${formatted}`;
};
