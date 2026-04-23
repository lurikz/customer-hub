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
   
    return `https://wa.me/${cleaned}`;
 };
