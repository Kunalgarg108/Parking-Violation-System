import { describe, it, expect, beforeEach } from 'vitest';
import { computeKPIs } from '../../services/dashboardService.js';
import { dataCache } from '../../services/csvLoader.js';
import type { PredictionRecord } from '../../types/index.js';

/**
 * Helper to create a minimal PredictionRecord with a given riskScore100.
 */
function makePrediction(zoneId: string, riskScore100: number): PredictionRecord {
  return {
    zoneId,
    latitude: 0,
    longitude: 0,
    riskScore100,
    expectedSeverity: 0,
    activityProbability: 0,
    violations: 0,
    severity: 0,
    avgSeverity: 0,
    uniqueVehicles: 0,
    junctionCount: 0,
    avgRepeatOffender: 0,
    hour: 0,
    dayOfWeek: 0,
    month: 0,
    isWeekend: 0,
    cellDensity: 0,
    severityLag1: 0,
    severityLag12: 0,
    severityLag84: 0,
    junctionLag1: 0,
    repeatLag1: 0,
    severityRoll3: 0,
    severityRoll12: 0,
    severityChange: 0,
    activityRate12: 0,
    junctionRatio: 0,
    timestamp: '',
    locationDescription: '',
  };
}

describe('dashboardService - computeKPIs', () => {
  beforeEach(() => {
    dataCache.predictions = new Map();
  });

  it('returns all zeros for an empty dataset', () => {
    const result = computeKPIs();

    expect(result).toEqual({
      totalActiveZones: 0,
      averageRiskScore100: 0,
      totalCriticalZones: 0,
      totalHighRiskZones: 0,
    });
  });

  it('correctly aggregates KPIs with sample data', () => {
    // Setup: 5 zones with scores 30, 55, 65, 80, 95
    dataCache.predictions.set('z1', makePrediction('z1', 30));
    dataCache.predictions.set('z2', makePrediction('z2', 55));
    dataCache.predictions.set('z3', makePrediction('z3', 65));
    dataCache.predictions.set('z4', makePrediction('z4', 80));
    dataCache.predictions.set('z5', makePrediction('z5', 95));

    const result = computeKPIs();

    expect(result.totalActiveZones).toBe(5);
    // Mean: (30 + 55 + 65 + 80 + 95) / 5 = 325 / 5 = 65.0
    expect(result.averageRiskScore100).toBe(65.0);
    // Critical (>= 80): z4 (80), z5 (95) = 2
    expect(result.totalCriticalZones).toBe(2);
    // High risk (>= 60): z3 (65), z4 (80), z5 (95) = 3
    expect(result.totalHighRiskZones).toBe(3);
  });

  it('counts a zone with score exactly 60 as high risk but not critical', () => {
    dataCache.predictions.set('z1', makePrediction('z1', 60));

    const result = computeKPIs();

    expect(result.totalActiveZones).toBe(1);
    expect(result.averageRiskScore100).toBe(60.0);
    expect(result.totalHighRiskZones).toBe(1);
    expect(result.totalCriticalZones).toBe(0);
  });

  it('counts a zone with score exactly 80 as both high risk and critical', () => {
    dataCache.predictions.set('z1', makePrediction('z1', 80));

    const result = computeKPIs();

    expect(result.totalActiveZones).toBe(1);
    expect(result.averageRiskScore100).toBe(80.0);
    expect(result.totalHighRiskZones).toBe(1);
    expect(result.totalCriticalZones).toBe(1);
  });

  it('rounds averageRiskScore100 to 1 decimal place', () => {
    // Scores: 33, 33, 34 → mean = 100/3 = 33.333... → rounded to 33.3
    dataCache.predictions.set('z1', makePrediction('z1', 33));
    dataCache.predictions.set('z2', makePrediction('z2', 33));
    dataCache.predictions.set('z3', makePrediction('z3', 34));

    const result = computeKPIs();

    expect(result.averageRiskScore100).toBe(33.3);
  });

  it('does not count zones below 60 as high risk or critical', () => {
    dataCache.predictions.set('z1', makePrediction('z1', 59));
    dataCache.predictions.set('z2', makePrediction('z2', 0));
    dataCache.predictions.set('z3', makePrediction('z3', 79));

    const result = computeKPIs();

    expect(result.totalActiveZones).toBe(3);
    // 79 >= 60 → high risk
    expect(result.totalHighRiskZones).toBe(1);
    // None >= 80
    expect(result.totalCriticalZones).toBe(0);
  });
});
