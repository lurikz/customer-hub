import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

 export const getWhatsAppLink = (phone: string | null) => {
   if (!phone) return "";
   // Rule: Remove spaces, parentheses, dashes, special characters, and "+"
   let cleaned = phone.replace(/\D/g, "");
   
   // Remove leading zero if present (common in Brazil)
   if (cleaned.startsWith("0")) {
     cleaned = cleaned.substring(1);
   }
   
   // Rule: Ensure international format (ex: 5511999999999)
   // If it's a Brazilian number (10 or 11 digits), add the country code (55)
   let formatted = cleaned;
   if (cleaned.length === 10 || cleaned.length === 11) {
     formatted = `55${cleaned}`;
   }
   
   return `https://wa.me/${formatted}`;
 };
