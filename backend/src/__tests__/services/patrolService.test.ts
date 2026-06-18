import { describe, it, expect, beforeEach } from 'vitest';
import { validateUnitCount, assignPatrols } from '../../services/patrolService.js';
import { dataCache } from '../../services/csvLoader.js';
import type { PredictionRecord } from '../../types/index.js';

/**
 * Helper to create a minimal PredictionRecord with given zoneId and riskScore100.
 */
function makePrediction(zoneId: string, riskScore100: number, expectedSeverity = 5.0): PredictionRecord {
  return {
    zoneId,
    latitude: 0,
    longitude: 0,
    riskScore100,
    expectedSeverity,
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

// ---------------------------------------------------------------------------
// validateUnitCount tests
// ---------------------------------------------------------------------------
describe('patrolService - validateUnitCount', () => {
  it('accepts valid integer within range (1)', () => {
    expect(validateUnitCount(1)).toBe(1);
  });

  it('accepts valid integer within range (50)', () => {
    expect(validateUnitCount(50)).toBe(50);
  });

  it('accepts valid integer within range (25)', () => {
    expect(validateUnitCount(25)).toBe(25);
  });

  it('accepts numeric string "10"', () => {
    expect(validateUnitCount('10')).toBe(10);
  });

  it('rejects non-numeric input', () => {
    expect(() => validateUnitCount('abc')).toThrow('Unit count must be a numeric value');
  });

  it('rejects null input', () => {
    expect(() => validateUnitCount(null)).toThrow();
  });

  it('rejects undefined input', () => {
    expect(() => validateUnitCount(undefined)).toThrow();
  });

  it('rejects non-integer (3.5)', () => {
    expect(() => validateUnitCount(3.5)).toThrow('Unit count must be an integer');
  });

  it('rejects value below range (0)', () => {
    expect(() => validateUnitCount(0)).toThrow('Unit count must be between 1 and 50');
  });

  it('rejects negative value (-1)', () => {
    expect(() => validateUnitCount(-1)).toThrow('Unit count must be between 1 and 50');
  });

  it('rejects value above range (51)', () => {
    expect(() => validateUnitCount(51)).toThrow('Unit count must be between 1 and 50');
  });

  it('rejects NaN', () => {
    expect(() => validateUnitCount(NaN)).toThrow('Unit count must be a numeric value');
  });
});

// ---------------------------------------------------------------------------
// assignPatrols tests
// ---------------------------------------------------------------------------
describe('patrolService - assignPatrols', () => {
  beforeEach(() => {
    dataCache.topZones = [];
  });

  it('returns correct assignments sorted by descending risk', () => {
    // topZones are already pre-sorted descending
    dataCache.topZones = [
      makePrediction('z1', 90, 12.0),
      makePrediction('z2', 75, 8.0),
      makePrediction('z3', 55, 6.0),
      makePrediction('z4', 40, 4.0),
      makePrediction('z5', 30, 2.0), // below threshold
    ];

    const result = assignPatrols(3);

    expect(result.assignments).toHaveLength(3);
    expect(result.assignments[0]).toEqual({
      unitLabel: 'Unit 1',
      zoneId: 'z1',
      riskScore100: 90,
      expectedSeverity: 12.0,
      priorityLevel: 'critical',
    });
    expect(result.assignments[1]).toEqual({
      unitLabel: 'Unit 2',
      zoneId: 'z2',
      riskScore100: 75,
      expectedSeverity: 8.0,
      priorityLevel: 'high',
    });
    expect(result.assignments[2]).toEqual({
      unitLabel: 'Unit 3',
      zoneId: 'z3',
      riskScore100: 55,
      expectedSeverity: 6.0,
      priorityLevel: 'medium',
    });
    expect(result.totalQualifyingZones).toBe(4); // z1, z2, z3, z4 (>= 40)
    expect(result.shortfall).toBeNull();
  });

  it('filters out zones with riskScore100 below 40', () => {
    dataCache.topZones = [
      makePrediction('z1', 39),
      makePrediction('z2', 20),
      makePrediction('z3', 10),
    ];

    const result = assignPatrols(2);

    expect(result.assignments).toHaveLength(0);
    expect(result.totalQualifyingZones).toBe(0);
    expect(result.shortfall).toBe(2);
  });

  it('includes zones with riskScore100 exactly 40', () => {
    dataCache.topZones = [
      makePrediction('z1', 40, 3.0),
    ];

    const result = assignPatrols(1);

    expect(result.assignments).toHaveLength(1);
    expect(result.assignments[0].zoneId).toBe('z1');
    expect(result.assignments[0].priorityLevel).toBe('medium');
    expect(result.shortfall).toBeNull();
  });

  it('detects shortfall when qualifying zones < requested units', () => {
    dataCache.topZones = [
      makePrediction('z1', 85, 10.0),
      makePrediction('z2', 60, 7.0),
    ];

    const result = assignPatrols(5);

    expect(result.assignments).toHaveLength(2);
    expect(result.totalQualifyingZones).toBe(2);
    expect(result.shortfall).toBe(3); // 5 - 2 = 3
  });

  it('labels units sequentially starting at Unit 1', () => {
    dataCache.topZones = [
      makePrediction('z1', 95),
      makePrediction('z2', 80),
      makePrediction('z3', 65),
      makePrediction('z4', 50),
    ];

    const result = assignPatrols(4);

    expect(result.assignments.map((a) => a.unitLabel)).toEqual([
      'Unit 1',
      'Unit 2',
      'Unit 3',
      'Unit 4',
    ]);
  });

  it('handles empty topZones array', () => {
    dataCache.topZones = [];

    const result = assignPatrols(3);

    expect(result.assignments).toHaveLength(0);
    expect(result.totalQualifyingZones).toBe(0);
    expect(result.shortfall).toBe(3);
  });
});
