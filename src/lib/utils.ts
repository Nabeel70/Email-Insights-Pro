
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
    // The API might return dates like "7/21/25, 8:33 AM" or "2023-10-20 09:00:00".
    // The JS Date constructor is surprisingly robust with many formats.
    const date = new Date(dateString);

    // Check if the date is valid.
    if (isNaN(date.getTime())) {
      // If direct parsing fails, try replacing space with 'T' for ISO-like formats
      const isoAttempt = new Date(dateString.replace(' ', 'T'));
       if (isNaN(isoAttempt.getTime())) {
         return 'N/A';
       }
       return isoAttempt.toLocaleDateString('en-US', {
         year: 'numeric',
         month: '2-digit',
         day: '2-digit',
       });
    }

    // Format to MM/DD/YYYY
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
  } catch (error) {
    // If any error occurs during parsing, return N/A
    console.error(`Could not parse date: ${dateString}`, error);
    return 'N/A';
  }
}
