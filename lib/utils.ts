import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format phone number to consistent US format: (XXX)XXX-XXXX
 * Strips all non-digit characters and formats 10-digit numbers
 * @param phone - Raw phone number string
 * @returns Formatted phone number or null if invalid
 */
export function formatPhoneNumber(
  phone: string | null | undefined
): string | null {
  if (!phone) return null;

  // Strip all non-digit characters
  const digits = phone.replace(/\D/g, "");

  // Handle 10-digit US numbers
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)})${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // Handle 11-digit numbers starting with 1 (US country code)
  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)})${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  // If not a valid US phone number, return original
  return phone;
}
