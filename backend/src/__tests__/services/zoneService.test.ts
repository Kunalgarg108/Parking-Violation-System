import { describe, it, expect, beforeEach } from 'vitest';
import { dataCache } from '../../services/csvLoader.js';
import { getById, getTopZones, filterZones, classifyRisk, deriveRecommendedAction } from '../../services/zoneService.js';
import type { PredictionRecord, SHAPFeatureImportance, ContributingFeature } from '../../types/index.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------
function makePredictionRecord(overrides: Partial<PredictionRecord> = {}): PredictionRecord {
  return {
    zoneId: 'zone-001',
    latitude: 51.5,
    longitude: -0.12,
    riskScore100: 75,
    expectedSeverity: 12.5,
    activityProbability: 0.8,
    violations: 10,
    severity: 5,
    avgSeverity: 4.2,
    uniqueVehicles: 8,
    junctionCount: 3,
    avgRepeatOffender: 0.6,
    hour: 14,
    dayOfWeek: 2,
    month: 6,
    isWeekend: 0,
    cellDensity: 0.7,
    severityLag1: 4.0,
    severityLag12: 3.5,
    severityLag84: 2.8,
    junctionLag1: 2,
    repeatLag1: 0.4,
    severityRoll3: 4.1,
    severityRoll12: 3.8,
    severityChange: 0.5,
    activityRate12: 0.65,
    junctionRatio: 0.45,
    timestamp: '2024-01-01T00:00:00Z',
    locationDescription: 'Test Location',
    ...overrides,
  };
}

const mockSHAP: SHAPFeatureImportance[] = [
  { featureName: 'violations', importance: 0.185 },
  { featureName: 'severity', importance: 0.142 },
  { featureName: 'avg_severity', importance: 0.098 },
  { featureName: 'junction_count', importance: 0.076 },
  { featureName: 'unique_vehicles', importance: 0.068 },
  { featureName: 'cell_density', importance: 0.062 },
  { featureName: 'severity_roll_3', importance: 0.058 },
  { featureName: 'activity_rate_12', importance: 0.054 },
  { featureName: 'avg_repeat_offender', importance: 0.048 },
  { featureName: 'severity_lag_1', importance: 0.045 },
  { featureName: 'severity_change', importance: 0.038 },
  { featureName: 'junction_ratio', importance: 0.035 },
  { featureName: 'repeat_lag_1', importance: 0.028 },
  { featureName: 'severity_roll_12', importance: 0.024 },
  { featureName: 'hour', importance: 0.018 },
  { featureName: 'severity_lag_12', importance: 0.015 },
  { featureName: 'junction_lag_1', importance: 0.012 },
  { featureName: 'day_of_week', importance: 0.008 },
  { featureName: 'is_weekend', importance: 0.005 },
  { featureName: 'month', importance: 0.004 },
  { featureName: 'severity_lag_84', importance: 0.003 },
];

// ---------------------------------------------------------------------------
// classifyRisk
// ---------------------------------------------------------------------------
describe('classifyRisk', () => {
  it('returns low for score < 40', () => {
    expect(classifyRisk(0)).toBe('low');
    expect(classifyRisk(39.9)).toBe('low');
  });

  it('returns medium for 40 <= score < 60', () => {
    expect(classifyRisk(40)).toBe('medium');
    expect(classifyRisk(59.9)).toBe('medium');
  });

  it('returns high for 60 <= score < 80', () => {
    expect(classifyRisk(60)).toBe('high');
    expect(classifyRisk(79.9)).toBe('high');
  });

  it('returns critical for score >= 80', () => {
    expect(classifyRisk(80)).toBe('critical');
    expect(classifyRisk(100)).toBe('critical');
  });
});

// ---------------------------------------------------------------------------
// getById
// ---------------------------------------------------------------------------
describe('getById', () => {
  beforeEach(() => {
    dataCache.predictions.clear();
    dataCache.topZones = [];
    dataCache.shapImportance = [...mockSHAP];
  });

  it('returns null when zone is not found', () => {
    const result = getById('nonexistent-zone');
    expect(result).toBeNull();
  });

  it('returns ZoneDetail with contributing features sorted by importance (top 10)', () => {
    const record = makePredictionRecord({ zoneId: 'zone-abc', riskScore100: 85 });
    dataCache.predictions.set('zone-abc', record);

    const result = getById('zone-abc');
    expect(result).not.toBeNull();
    expect(result!.zoneId).toBe('zone-abc');
    expect(result!.riskScore100).toBe(85);
    expect(result!.priorityLevel).toBe('critical');

    // Contributing features should be top 10 sorted by importance descending
    expect(result!.contributingFeatures).toHaveLength(10);
    expect(result!.contributingFeatures[0].name).toBe('violations');
    expect(result!.contributingFeatures[0].importance).toBe(0.185);
    expect(result!.contributingFeatures[1].name).toBe('severity');
    expect(result!.contributingFeatures[9].name).toBe('severity_lag_1');

    // Check importance ordering
    for (let i = 0; i < result!.contributingFeatures.length - 1; i++) {
      expect(result!.contributingFeatures[i].importance).toBeGreaterThanOrEqual(
        result!.contributingFeatures[i + 1].importance,
      );
    }
  });

  it('derives correct recommended action for critical zone', () => {
    const record = makePredictionRecord({ zoneId: 'zone-crit', riskScore100: 90 });
    dataCache.predictions.set('zone-crit', record);

    const result = getById('zone-crit');
    expect(result!.recommendedAction.type).toBe('deploy_patrol_immediate');
    expect(result!.recommendedAction.description).toBe('Deploy patrol within 1 hour');
    expect(result!.recommendedAction.reason).toContain('Critical risk due to:');
  });

  it('derives correct recommended action for high-risk zone', () => {
    const record = makePredictionRecord({ zoneId: 'zone-high', riskScore100: 70 });
    dataCache.predictions.set('zone-high', record);

    const result = getById('zone-high');
    expect(result!.recommendedAction.type).toBe('deploy_patrol');
    expect(result!.recommendedAction.description).toBe('Deploy patrol within 2 hours');
  });

  it('derives correct recommended action for medium-risk zone', () => {
    const record = makePredictionRecord({ zoneId: 'zone-med', riskScore100: 50 });
    dataCache.predictions.set('zone-med', record);

    const result = getById('zone-med');
    expect(result!.recommendedAction.type).toBe('monitor');
    expect(result!.recommendedAction.description).toBe('Schedule monitoring check within 24 hours');
  });

  it('derives correct recommended action for low-risk zone', () => {
    const record = makePredictionRecord({ zoneId: 'zone-low', riskScore100: 20 });
    dataCache.predictions.set('zone-low', record);

    const result = getById('zone-low');
    expect(result!.recommendedAction.type).toBe('no_action');
    expect(result!.recommendedAction.description).toBe('No immediate action required');
    expect(result!.recommendedAction.reason).toBe('Risk level is within acceptable thresholds');
  });

  it('includes correct feature values from the prediction record', () => {
    const record = makePredictionRecord({
      zoneId: 'zone-vals',
      riskScore100: 85,
      violations: 15,
      severity: 7,
    });
    dataCache.predictions.set('zone-vals', record);

    const result = getById('zone-vals');
    const violationsFeature = result!.contributingFeatures.find((f) => f.name === 'violations');
    expect(violationsFeature!.value).toBe(15);

    const severityFeature = result!.contributingFeatures.find((f) => f.name === 'severity');
    expect(severityFeature!.value).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// getTopZones
// ---------------------------------------------------------------------------
describe('getTopZones', () => {
  beforeEach(() => {
    dataCache.predictions.clear();
    dataCache.topZones = [];
    dataCache.shapImportance = [...mockSHAP];
  });

  it('returns top N zones sorted by descending risk_score_100', () => {
    const zones = [
      makePredictionRecord({ zoneId: 'z1', riskScore100: 90 }),
      makePredictionRecord({ zoneId: 'z2', riskScore100: 85 }),
      makePredictionRecord({ zoneId: 'z3', riskScore100: 70 }),
      makePredictionRecord({ zoneId: 'z4', riskScore100: 50 }),
      makePredictionRecord({ zoneId: 'z5', riskScore100: 30 }),
    ];
    dataCache.topZones = zones; // already sorted descending

    const result = getTopZones(3);
    expect(result).toHaveLength(3);
    expect(result[0].zoneId).toBe('z1');
    expect(result[0].riskScore100).toBe(90);
    expect(result[1].zoneId).toBe('z2');
    expect(result[2].zoneId).toBe('z3');
  });

  it('returns all zones when limit exceeds total count', () => {
    const zones = [
      makePredictionRecord({ zoneId: 'z1', riskScore100: 80 }),
      makePredictionRecord({ zoneId: 'z2', riskScore100: 60 }),
    ];
    dataCache.topZones = zones;

    const result = getTopZones(10);
    expect(result).toHaveLength(2);
  });

  it('returns empty array when no zones exist', () => {
    const result = getTopZones(5);
    expect(result).toHaveLength(0);
  });

  it('maps records to Zone objects with correct fields', () => {
    const record = makePredictionRecord({ zoneId: 'z1', riskScore100: 85, latitude: 51.5, longitude: -0.1 });
    dataCache.topZones = [record];

    const result = getTopZones(1);
    expect(result[0]).toEqual({
      zoneId: 'z1',
      h3Index: 'z1',
      latitude: 51.5,
      longitude: -0.1,
      riskScore100: 85,
      expectedSeverity: 12.5,
      activityProbability: 0.8,
      priorityLevel: 'critical',
      locationDescription: 'Test Location',
      topViolationDetails: '',
    });
  });
});

// ---------------------------------------------------------------------------
// filterZones
// ---------------------------------------------------------------------------
describe('filterZones', () => {
  beforeEach(() => {
    dataCache.predictions.clear();
    dataCache.shapImportance = [...mockSHAP];
    dataCache.topZones = [
      makePredictionRecord({ zoneId: 'z1', riskScore100: 92 }),   // critical
      makePredictionRecord({ zoneId: 'z2', riskScore100: 75 }),   // high
      makePredictionRecord({ zoneId: 'z3', riskScore100: 55 }),   // medium
      makePredictionRecord({ zoneId: 'z4', riskScore100: 30 }),   // low
      makePredictionRecord({ zoneId: 'z5', riskScore100: 82 }),   // critical
    ];
  });

  it('filters by minimum risk score', () => {
    const result = filterZones(80);
    expect(result).toHaveLength(2);
    expect(result.every((z) => z.riskScore100 >= 80)).toBe(true);
  });

  it('filters by priority level', () => {
    const result = filterZones(undefined, ['high']);
    expect(result).toHaveLength(1);
    expect(result[0].zoneId).toBe('z2');
    expect(result[0].priorityLevel).toBe('high');
  });

  it('filters by multiple priority levels', () => {
    const result = filterZones(undefined, ['critical', 'high']);
    expect(result).toHaveLength(3);
    expect(result.every((z) => z.priorityLevel === 'critical' || z.priorityLevel === 'high')).toBe(true);
  });

  it('combines minRisk and levels filters', () => {
    // minRisk=50 filters out z4 (30), levels=['high'] then keeps only high-level zones
    const result = filterZones(50, ['high']);
    expect(result).toHaveLength(1);
    expect(result[0].zoneId).toBe('z2');
  });

  it('returns all zones when no filters applied', () => {
    const result = filterZones();
    expect(result).toHaveLength(5);
  });

  it('returns empty array when no zones match', () => {
    const result = filterZones(95);
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// deriveRecommendedAction
// ---------------------------------------------------------------------------
describe('deriveRecommendedAction', () => {
  const sampleFeatures: ContributingFeature[] = [
    { name: 'severity_lag_1', value: 4.2, importance: 0.35 },
    { name: 'junction_count', value: 3, importance: 0.25 },
    { name: 'avg_repeat_offender', value: 0.8, importance: 0.15 },
    { name: 'cell_density', value: 12, importance: 0.10 },
  ];

  describe('Critical bracket (riskScore100 >= 80)', () => {
    it('returns deploy_patrol_immediate with correct description and reason', () => {
      const result = deriveRecommendedAction(95, sampleFeatures);
      expect(result.type).toBe('deploy_patrol_immediate');
      expect(result.description).toBe('Deploy patrol within 1 hour');
      expect(result.reason).toContain('Critical risk due to:');
      expect(result.reason).toContain('severity lag 1');
      expect(result.reason).toContain('junction count');
      expect(result.reason).toContain('avg repeat offender');
    });

    it('returns deploy_patrol_immediate for score exactly 80 (boundary)', () => {
      const result = deriveRecommendedAction(80, sampleFeatures);
      expect(result.type).toBe('deploy_patrol_immediate');
      expect(result.description).toBe('Deploy patrol within 1 hour');
      expect(result.reason).toContain('Critical risk due to:');
    });

    it('returns deploy_patrol_immediate for score of 100', () => {
      const result = deriveRecommendedAction(100, sampleFeatures);
      expect(result.type).toBe('deploy_patrol_immediate');
    });
  });

  describe('High bracket (60 <= riskScore100 < 80)', () => {
    it('returns deploy_patrol with correct description and reason', () => {
      const result = deriveRecommendedAction(70, sampleFeatures);
      expect(result.type).toBe('deploy_patrol');
      expect(result.description).toBe('Deploy patrol within 2 hours');
      expect(result.reason).toContain('High risk due to:');
      expect(result.reason).toContain('severity lag 1');
      expect(result.reason).toContain('junction count');
      expect(result.reason).toContain('avg repeat offender');
    });

    it('returns deploy_patrol for score exactly 60 (boundary)', () => {
      const result = deriveRecommendedAction(60, sampleFeatures);
      expect(result.type).toBe('deploy_patrol');
      expect(result.description).toBe('Deploy patrol within 2 hours');
      expect(result.reason).toContain('High risk due to:');
    });

    it('returns deploy_patrol for score of 79.9', () => {
      const result = deriveRecommendedAction(79.9, sampleFeatures);
      expect(result.type).toBe('deploy_patrol');
    });
  });

  describe('Medium bracket (40 <= riskScore100 < 60)', () => {
    it('returns monitor with correct description and reason', () => {
      const result = deriveRecommendedAction(50, sampleFeatures);
      expect(result.type).toBe('monitor');
      expect(result.description).toBe('Schedule monitoring check within 24 hours');
      expect(result.reason).toContain('Medium risk due to:');
      expect(result.reason).toContain('severity lag 1');
      expect(result.reason).toContain('junction count');
      expect(result.reason).toContain('avg repeat offender');
    });

    it('returns monitor for score exactly 40 (boundary)', () => {
      const result = deriveRecommendedAction(40, sampleFeatures);
      expect(result.type).toBe('monitor');
      expect(result.description).toBe('Schedule monitoring check within 24 hours');
      expect(result.reason).toContain('Medium risk due to:');
    });

    it('returns monitor for score of 59.9', () => {
      const result = deriveRecommendedAction(59.9, sampleFeatures);
      expect(result.type).toBe('monitor');
    });
  });

  describe('Low bracket (riskScore100 < 40)', () => {
    it('returns no_action with threshold reason', () => {
      const result = deriveRecommendedAction(20, []);
      expect(result.type).toBe('no_action');
      expect(result.description).toBe('No immediate action required');
      expect(result.reason).toBe('Risk level is within acceptable thresholds');
    });

    it('returns no_action for score of 0', () => {
      const result = deriveRecommendedAction(0, sampleFeatures);
      expect(result.type).toBe('no_action');
      expect(result.reason).toBe('Risk level is within acceptable thresholds');
    });

    it('returns no_action for score of 39.9', () => {
      const result = deriveRecommendedAction(39.9, sampleFeatures);
      expect(result.type).toBe('no_action');
    });
  });

  describe('Edge cases', () => {
    it('handles empty features array gracefully for critical bracket', () => {
      const result = deriveRecommendedAction(85, []);
      expect(result.type).toBe('deploy_patrol_immediate');
      expect(result.description).toBe('Deploy patrol within 1 hour');
      expect(result.reason).toBe('Critical risk due to: ');
    });

    it('handles empty features array gracefully for medium bracket', () => {
      const result = deriveRecommendedAction(45, []);
      expect(result.type).toBe('monitor');
      expect(result.reason).toBe('Medium risk due to: ');
    });

    it('uses only top 3 features even if more are provided', () => {
      const manyFeatures: ContributingFeature[] = [
        { name: 'feature_one', value: 1, importance: 0.5 },
        { name: 'feature_two', value: 2, importance: 0.4 },
        { name: 'feature_three', value: 3, importance: 0.3 },
        { name: 'feature_four', value: 4, importance: 0.2 },
        { name: 'feature_five', value: 5, importance: 0.1 },
      ];
      const result = deriveRecommendedAction(85, manyFeatures);
      expect(result.reason).toContain('feature one');
      expect(result.reason).toContain('feature two');
      expect(result.reason).toContain('feature three');
      expect(result.reason).not.toContain('feature four');
      expect(result.reason).not.toContain('feature five');
    });

    it('replaces underscores with spaces in feature names', () => {
      const features: ContributingFeature[] = [
        { name: 'severity_lag_1', value: 1, importance: 0.5 },
      ];
      const result = deriveRecommendedAction(90, features);
      expect(result.reason).toContain('severity lag 1');
      expect(result.reason).not.toContain('severity_lag_1');
    });
  });
});
