import { describe, it, expect, beforeEach } from 'vitest';
import { computeRiskHistogram, computePriorityDistribution } from '../../services/analyticsService.js';
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

describe('analyticsService - computeRiskHistogram', () => {
  beforeEach(() => {
    dataCache.topZones = [];
    dataCache.predictions = new Map();
  });

  it('returns 10 empty bins for an empty dataset', () => {
    const histogram = computeRiskHistogram();

    expect(histogram).toHaveLength(10);
    for (const bin of histogram) {
      expect(bin.count).toBe(0);
    }
    // Verify bin ranges
    expect(histogram[0]).toEqual({ binStart: 0, binEnd: 10, count: 0 });
    expect(histogram[9]).toEqual({ binStart: 90, binEnd: 100, count: 0 });
  });

  it('assigns zones to correct bins based on riskScore100', () => {
    dataCache.topZones = [
      makePrediction('z1', 5),   // bin 0-10
      makePrediction('z2', 15),  // bin 10-20
      makePrediction('z3', 25),  // bin 20-30
      makePrediction('z4', 55),  // bin 50-60
      makePrediction('z5', 95),  // bin 90-100
    ];

    const histogram = computeRiskHistogram();

    expect(histogram[0].count).toBe(1); // 0-10: z1(5)
    expect(histogram[1].count).toBe(1); // 10-20: z2(15)
    expect(histogram[2].count).toBe(1); // 20-30: z3(25)
    expect(histogram[5].count).toBe(1); // 50-60: z4(55)
    expect(histogram[9].count).toBe(1); // 90-100: z5(95)
    // Remaining bins should be 0
    expect(histogram[3].count).toBe(0);
    expect(histogram[4].count).toBe(0);
    expect(histogram[6].count).toBe(0);
    expect(histogram[7].count).toBe(0);
    expect(histogram[8].count).toBe(0);
  });

  it('places a score of exactly 100 into the last bin (90-100)', () => {
    dataCache.topZones = [makePrediction('z1', 100)];

    const histogram = computeRiskHistogram();

    expect(histogram[9].count).toBe(1);
  });

  it('places boundary scores correctly (e.g., 10 goes to bin 10-20)', () => {
    dataCache.topZones = [
      makePrediction('z1', 0),   // bin 0-10
      makePrediction('z2', 10),  // bin 10-20
      makePrediction('z3', 20),  // bin 20-30
      makePrediction('z4', 90),  // bin 90-100
    ];

    const histogram = computeRiskHistogram();

    expect(histogram[0].count).toBe(1); // 0
    expect(histogram[1].count).toBe(1); // 10
    expect(histogram[2].count).toBe(1); // 20
    expect(histogram[9].count).toBe(1); // 90
  });
});

describe('analyticsService - computePriorityDistribution', () => {
  beforeEach(() => {
    dataCache.topZones = [];
    dataCache.predictions = new Map();
  });

  it('returns all zeros for an empty dataset', () => {
    const distribution = computePriorityDistribution();

    expect(distribution).toEqual({
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    });
  });

  it('classifies zones into correct priority levels', () => {
    dataCache.topZones = [
      makePrediction('z1', 10),  // low (<40)
      makePrediction('z2', 39),  // low (<40)
      makePrediction('z3', 40),  // medium (40-<60)
      makePrediction('z4', 59),  // medium (40-<60)
      makePrediction('z5', 60),  // high (60-<80)
      makePrediction('z6', 79),  // high (60-<80)
      makePrediction('z7', 80),  // critical (>=80)
      makePrediction('z8', 100), // critical (>=80)
    ];

    const distribution = computePriorityDistribution();

    expect(distribution.low).toBe(2);
    expect(distribution.medium).toBe(2);
    expect(distribution.high).toBe(2);
    expect(distribution.critical).toBe(2);
  });

  it('distribution counts sum to total number of zones', () => {
    dataCache.topZones = [
      makePrediction('z1', 5),
      makePrediction('z2', 25),
      makePrediction('z3', 45),
      makePrediction('z4', 65),
      makePrediction('z5', 85),
      makePrediction('z6', 50),
      makePrediction('z7', 72),
    ];

    const distribution = computePriorityDistribution();
    const total = distribution.low + distribution.medium + distribution.high + distribution.critical;

    expect(total).toBe(dataCache.topZones.length);
  });
});
