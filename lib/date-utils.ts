/**
 * Utility functions for consistent date formatting
 * to avoid hydration errors between server and client components
 */

/**
 * Format a date in a consistent way across server and client
 * Uses YYYY-MM-DD format to ensure consistency
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Format as YYYY-MM-DD to avoid locale differences
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Format a date in a user-friendly format that's consistent
 * between server and client rendering
 */
export function formatDateFriendly(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Format as DD/MM/YYYY to ensure consistency
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
}