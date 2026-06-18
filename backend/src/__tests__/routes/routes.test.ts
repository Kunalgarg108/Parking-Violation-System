import { describe, it, expect, beforeAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import { dataCache } from '../../services/csvLoader.js';
import { globalErrorHandler } from '../../middleware/errorHandler.js';
import dashboardRouter from '../../routes/dashboard.js';
import zonesRouter from '../../routes/zones.js';
import patrolRouter from '../../routes/patrol.js';
import analyticsRouter from '../../routes/analytics.js';
import shapRouter from '../../routes/shap.js';
import repeatOffendersRouter from '../../routes/repeatOffenders.js';
import type { PredictionRecord, SHAPFeatureImportance } from '../../types/index.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------
function makePrediction(
  zoneId: string,
  riskScore100: number,
  overrides: Partial<PredictionRecord> = {},
): PredictionRecord {
  return {
    zoneId,
    latitude: 40.7128,
    longitude: -74.006,
    riskScore100,
    expectedSeverity: riskScore100 * 0.5,
    activityProbability: riskScore100 / 100,
    violations: 5,
    severity: 3,
    avgSeverity: 2.5,
    uniqueVehicles: 10,
    junctionCount: 2,
    avgRepeatOffender: 0.3,
    hour: 14,
    dayOfWeek: 3,
    month: 6,
    isWeekend: 0,
    cellDensity: 1.2,
    severityLag1: 2,
    severityLag12: 1.5,
    severityLag84: 1.0,
    junctionLag1: 1,
    repeatLag1: 0.2,
    severityRoll3: 2.1,
    severityRoll12: 1.8,
    severityChange: 0.5,
    activityRate12: 0.6,
    junctionRatio: 0.4,
    timestamp: '2024-01-15T14:00:00Z',
    locationDescription: `Zone ${zoneId} area`,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Create test Express app
// ---------------------------------------------------------------------------
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/zones', zonesRouter);
  app.use('/api/patrol', patrolRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/shap', shapRouter);
  app.use('/api/repeat-offenders', repeatOffendersRouter);
  app.use(globalErrorHandler);
  return app;
}

// ---------------------------------------------------------------------------
// Seed test data into the dataCache singleton
// ---------------------------------------------------------------------------
function seedTestData() {
  const predictions = new Map<string, PredictionRecord>();

  // Create zones with varying risk scores
  const zones = [
    makePrediction('zone-1', 95),   // critical
    makePrediction('zone-2', 85),   // critical
    makePrediction('zone-3', 72),   // high
    makePrediction('zone-4', 55),   // medium
    makePrediction('zone-5', 30),   // low
  ];

  for (const zone of zones) {
    predictions.set(zone.zoneId, zone);
  }

  // Sort by riskScore100 descending for topZones
  const topZones = zones.slice().sort((a, b) => b.riskScore100 - a.riskScore100);

  const shapImportance: SHAPFeatureImportance[] = [
    { featureName: 'violations', importance: 0.35 },
    { featureName: 'severity', importance: 0.25 },
    { featureName: 'hour', importance: 0.15 },
    { featureName: 'cell_density', importance: 0.10 },
    { featureName: 'avg_severity', importance: 0.08 },
  ];

  dataCache.predictions = predictions;
  dataCache.topZones = topZones;
  dataCache.shapImportance = shapImportance;
  dataCache.zoneMetadata = new Map();
  dataCache.repeatOffenders = new Map();
  dataCache.lastLoaded = new Date();
  dataCache.status = 'ready';
  dataCache.errors = [];
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
let app: express.Application;

beforeAll(() => {
  seedTestData();
  app = createTestApp();
});

describe('GET /api/dashboard', () => {
  it('returns success envelope with correct KPI shape', async () => {
    const res = await request(app).get('/api/dashboard');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveProperty('totalActiveZones');
    expect(res.body.data).toHaveProperty('averageRiskScore100');
    expect(res.body.data).toHaveProperty('totalCriticalZones');
    expect(res.body.data).toHaveProperty('totalHighRiskZones');
    expect(res.body.data.totalActiveZones).toBe(5);
  });
});

describe('GET /api/zones', () => {
  it('returns array of zones without filters', async () => {
    const res = await request(app).get('/api/zones');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(5);
  });

  it('filters zones by min_risk', async () => {
    const res = await request(app).get('/api/zones?min_risk=70');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data)).toBe(true);
    // zone-1 (95), zone-2 (85), zone-3 (72) are >= 70
    expect(res.body.data.length).toBe(3);
  });

  it('filters zones by level', async () => {
    const res = await request(app).get('/api/zones?level=critical');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    // zone-1 (95), zone-2 (85) are critical
    expect(res.body.data.length).toBe(2);
  });

  it('returns 400 for invalid min_risk', async () => {
    const res = await request(app).get('/api/zones?min_risk=abc');

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe('INVALID_PARAMETER');
  });

  it('returns 400 for invalid level value', async () => {
    const res = await request(app).get('/api/zones?level=extreme');

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe('INVALID_PARAMETER');
  });
});

describe('GET /api/zones/:id', () => {
  it('returns zone detail for valid ID', async () => {
    const res = await request(app).get('/api/zones/zone-1');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.zoneId).toBe('zone-1');
    expect(res.body.data).toHaveProperty('contributingFeatures');
    expect(res.body.data).toHaveProperty('recommendedAction');
  });

  it('returns 404 for non-existent zone ID', async () => {
    const res = await request(app).get('/api/zones/non-existent-zone');

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe('ZONE_NOT_FOUND');
  });
});

describe('GET /api/patrol/assignments', () => {
  it('returns correct assignments with valid units param', async () => {
    const res = await request(app).get('/api/patrol/assignments?units=3');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveProperty('assignments');
    expect(res.body.data).toHaveProperty('totalQualifyingZones');
    expect(Array.isArray(res.body.data.assignments)).toBe(true);
    expect(res.body.data.assignments.length).toBeLessThanOrEqual(3);
  });

  it('returns 400 error when units param is missing', async () => {
    const res = await request(app).get('/api/patrol/assignments');

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe('INVALID_PARAMETER');
  });

  it('returns 400 error when units is not a valid integer', async () => {
    const res = await request(app).get('/api/patrol/assignments?units=abc');

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe('INVALID_PARAMETER');
  });

  it('returns 400 error when units is out of range', async () => {
    const res = await request(app).get('/api/patrol/assignments?units=100');

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe('INVALID_PARAMETER');
  });
});

describe('GET /api/shap', () => {
  it('returns SHAP data array', async () => {
    const res = await request(app).get('/api/shap');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('featureName');
    expect(res.body.data[0]).toHaveProperty('importance');
  });
});

describe('GET /api/repeat-offenders', () => {
  it('returns repeat offenders data', async () => {
    const res = await request(app).get('/api/repeat-offenders');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveProperty('offenders');
    expect(res.body.data).toHaveProperty('total');
    expect(res.body.data).toHaveProperty('page');
    expect(res.body.data).toHaveProperty('pageSize');
  });
});

describe('GET /api/analytics', () => {
  it('returns analytics data with histogram, distribution, and SHAP', async () => {
    const res = await request(app).get('/api/analytics');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveProperty('riskHistogram');
    expect(res.body.data).toHaveProperty('priorityDistribution');
    expect(res.body.data).toHaveProperty('shapFeatureImportance');
    expect(Array.isArray(res.body.data.riskHistogram)).toBe(true);
    expect(res.body.data.riskHistogram.length).toBe(10);
    expect(res.body.data.priorityDistribution).toHaveProperty('low');
    expect(res.body.data.priorityDistribution).toHaveProperty('medium');
    expect(res.body.data.priorityDistribution).toHaveProperty('high');
    expect(res.body.data.priorityDistribution).toHaveProperty('critical');
    expect(Array.isArray(res.body.data.shapFeatureImportance)).toBe(true);
  });
});
