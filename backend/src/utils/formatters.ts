/**
 * Numeric precision helpers for the backend.
 */

/**
 * Round a numeric value to a specified number of decimal places.
 */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Format a number as a percentage string with 1 decimal place followed by "%".
 * Example: 73.2456 -> "73.2%"
 */
export function formatPercentage(value: number): string {
  return `${roundTo(value, 1)}%`;
}

/**
 * Format a risk score with 1 decimal place.
 * Example: 78.456 -> "78.5"
 */
export function formatRiskScore(value: number): string {
  return roundTo(value, 1).toFixed(1);
}

/**
 * Format a severity value with 2 decimal places.
 * Example: 12.3 -> "12.30"
 */
export function formatSeverity(value: number): string {
  return roundTo(value, 2).toFixed(2);
}
