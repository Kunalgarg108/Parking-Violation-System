import type { DashboardData } from '../types/index';
import { dataCache } from './csvLoader';
import { roundTo } from '../utils/formatters';

/**
 * Compute KPI aggregates from the in-memory prediction cache.
 *
 * - totalActiveZones:    total number of zones in the predictions Map
 * - averageRiskScore100: arithmetic mean of all riskScore100 values, rounded to 1 decimal
 * - totalCriticalZones:  count of zones with riskScore100 >= 80
 * - totalHighRiskZones:  count of zones with riskScore100 >= 60 (includes critical zones)
 *
 * Returns all zeros when the predictions Map is empty.
 */
export function computeKPIs(): DashboardData {
  const predictions = dataCache.predictions;

  const totalActiveZones = predictions.size;

  if (totalActiveZones === 0) {
    return {
      totalActiveZones: 0,
      averageRiskScore100: 0,
      totalCriticalZones: 0,
      totalHighRiskZones: 0,
    };
  }

  let scoreSum = 0;
  let totalCriticalZones = 0;
  let totalHighRiskZones = 0;

  for (const record of predictions.values()) {
    const score = record.riskScore100;
    scoreSum += score;

    if (score >= 80) {
      totalCriticalZones++;
    }

    if (score >= 60) {
      totalHighRiskZones++;
    }
  }

  const averageRiskScore100 = roundTo(scoreSum / totalActiveZones, 1);

  return {
    totalActiveZones,
    averageRiskScore100,
    totalCriticalZones,
    totalHighRiskZones,
  };
}
