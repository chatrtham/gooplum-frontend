import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts snake_case to sentence case for display purposes
 * Example: "create_email_draft" -> "Create email draft"
 */
export function toNormalCase(snakeCase: string): string {
  const words = snakeCase.split("_");
  return words
    .map((word, index) =>
      index === 0
        ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        : word.toLowerCase(),
    )
    .join(" ");
}
