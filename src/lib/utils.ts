import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateString(dateString: string | null | undefined): string {
  if (!dateString || dateString.trim() === '' || dateString.startsWith('0000-00-00')) {
    return 'N/A';
  }

  try {
    // The API returns dates like "2023-10-20 09:00:00". 
    // Replacing the space with 'T' makes it a valid ISO 8601 format that JS can parse.
    const isoString = dateString.replace(' ', 'T');
    const date = new Date(isoString);

    // Check if the date is valid.
    if (isNaN(date.getTime())) {
      return 'N/A';
    }

    // Format to MM/DD/YYYY
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
  } catch (error) {
    // If any error occurs during parsing, return N/A
    return 'N/A';
  }
}
