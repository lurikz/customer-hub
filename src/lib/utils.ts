import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

 export const getWhatsAppLink = (phone: string | null) => {
   if (!phone) return "";
   // Rule: Remove spaces, parentheses, dashes, or special characters and ensure no "+"
   const cleaned = phone.replace(/\D/g, "");
   
   // Rule: Ensure international format (ex: 5511999999999)
   // If it's a Brazilian number (10 or 11 digits) and doesn't have the country code, add 55
   let formatted = cleaned;
   if (cleaned.length === 10 || cleaned.length === 11) {
     formatted = `55${cleaned}`;
   }
   
   return `https://wa.me/${formatted}`;
 };
