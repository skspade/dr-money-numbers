/**
 * Money utility functions for consistent handling of monetary values across the application.
 * All database values are stored in cents (integer) to avoid floating-point precision issues.
 */

/**
 * Parses a string or number into a valid dollar amount
 * @param value String or number representing dollars (e.g., "10.99" or 10.99)
 * @returns Parsed dollar amount as number or null if invalid
 */
export function parseDollarAmount(value: string | number): number | null {
  if (typeof value === 'number') {
    if (isNaN(value) || !isFinite(value)) {
 return null;
}
    if (Math.abs(value) > 1000000000) {
 return null;
} // $1B limit
    // Round to 2 decimal places
    return Number((Math.round(value * 100) / 100).toFixed(2));
  }

  // Remove currency symbols, commas and whitespace
  const cleaned = value.replace(/[$,\s]/g, '');

  // Handle negative amounts with parentheses e.g. ($10.99)
  const amount = cleaned.match(/^\((.*)\)$/)
    ? -Number(cleaned.slice(1, -1))
    : Number(cleaned);

  if (isNaN(amount) || !isFinite(amount)) {
 return null;
}
  if (Math.abs(amount) > 1000000000) {
 return null;
} // $1B limit

  // Round to 2 decimal places
  return Number((Math.round(amount * 100) / 100).toFixed(2));
}

/**
 * Converts a dollar amount (float) to cents (integer)
 * @param dollars Amount in dollars (e.g., 10.99)
 * @returns Amount in cents (e.g., 1099)
 */
export function dollarsToCents(dollars: number | string): number {
  const parsed = parseDollarAmount(dollars);
  if (parsed === null) {
    throw new Error(`Invalid dollar amount: ${dollars}`);
  }
  return Math.round(parsed * 100);
}

/**
 * Converts cents (integer) to dollars (float)
 * @param cents Amount in cents (e.g., 1099)
 * @returns Amount in dollars (e.g., 10.99)
 */
export function centsToDollars(cents: number): number {
  // Round to 2 decimal places and ensure .00 is displayed
  return Number((Math.round(cents) / 100).toFixed(2));
}

/**
 * Formats a cent amount to a localized currency string
 * @param cents Amount in cents (e.g., 1099)
 * @param locale Locale for formatting (defaults to 'en-US')
 * @param currency Currency code (defaults to 'USD')
 * @returns Formatted currency string (e.g., "$10.99")
 */
export function formatMoney(
  cents: number,
  locale: string = 'en-US',
  currency: string = 'USD',
): string {
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currency === 'JPY' ? 0 : 2,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2,
  });
  return formatter.format(centsToDollars(cents));
}

/**
 * Type guard to check if a value is a valid money amount
 * @param value Any value to check
 * @returns True if the value can be safely converted to a money amount
 */
export function isValidMoneyAmount(value: unknown): value is number {
  if (typeof value !== 'number') {
 return false;
}
  if (isNaN(value) || !isFinite(value)) {
 return false;
}
  if (Math.abs(value) > 1000000000) {
 return false;
} // $1B limit
  return true;
}
