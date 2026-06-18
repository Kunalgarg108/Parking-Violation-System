/**
 * Display formatting utilities for the frontend.
 */

/**
 * Format a number as a percentage string with 1 decimal place followed by "%".
 * Example: 73.2456 -> "73.2%"
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Format a risk score with 1 decimal place.
 * Example: 78.456 -> "78.5"
 */
export function formatRiskScore(value: number): string {
  return value.toFixed(1);
}

/**
 * Format a severity value with 2 decimal places.
 * Example: 12.3 -> "12.30"
 */
export function formatSeverity(value: number): string {
  return value.toFixed(2);
}

/**
 * Format a coordinate value with 6 decimal places.
 * Example: 40.71277600001 -> "40.712776"
 */
export function formatCoordinates(value: number): string {
  return value.toFixed(6);
}

/**
 * Format a count as a whole integer string (no decimal point).
 * Example: 142.7 -> "142"
 */
export function formatCount(value: number): string {
  return Math.round(value).toString();
}
