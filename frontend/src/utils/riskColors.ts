/**
 * Risk classification and color mapping utilities.
 * Implements 4-level threshold logic:
 *   Low:      0–40  (score < 40)
 *   Medium:  40–60  (score >= 40 and < 60)
 *   High:    60–80  (score >= 60 and < 80)
 *   Critical: 80–100 (score >= 80)
 */

export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Classify a risk score (0-100) into a priority level.
 */
export function classifyRisk(score: number): PriorityLevel {
  if (score < 40) return 'low';
  if (score < 60) return 'medium';
  if (score < 80) return 'high';
  return 'critical';
}

/**
 * Map a risk score (0-100) to a hex color string.
 */
export function riskColor(score: number): string {
  if (score < 40) return '#22c55e'; // green - Low
  if (score < 60) return '#eab308'; // yellow - Medium
  if (score < 80) return '#f97316'; // orange - High
  return '#ef4444'; // red - Critical
}
