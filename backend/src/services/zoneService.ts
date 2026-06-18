import { dataCache } from './csvLoader';
import type {
  Zone,
  ZoneDetail,
  ContributingFeature,
  RecommendedAction,
  PriorityLevel,
  PredictionRecord,
} from '../types/index';

// ---------------------------------------------------------------------------
// Feature column mapping: PredictionRecord field → CSV feature name
// ---------------------------------------------------------------------------
const FEATURE_COLUMNS: { field: keyof PredictionRecord; name: string }[] = [
  { field: 'violations', name: 'violations' },
  { field: 'severity', name: 'severity' },
  { field: 'avgSeverity', name: 'avg_severity' },
  { field: 'uniqueVehicles', name: 'unique_vehicles' },
  { field: 'junctionCount', name: 'junction_count' },
  { field: 'avgRepeatOffender', name: 'avg_repeat_offender' },
  { field: 'hour', name: 'hour' },
  { field: 'dayOfWeek', name: 'day_of_week' },
  { field: 'month', name: 'month' },
  { field: 'isWeekend', name: 'is_weekend' },
  { field: 'cellDensity', name: 'cell_density' },
  { field: 'severityLag1', name: 'severity_lag_1' },
  { field: 'severityLag12', name: 'severity_lag_12' },
  { field: 'severityLag84', name: 'severity_lag_84' },
  { field: 'junctionLag1', name: 'junction_lag_1' },
  { field: 'repeatLag1', name: 'repeat_lag_1' },
  { field: 'severityRoll3', name: 'severity_roll_3' },
  { field: 'severityRoll12', name: 'severity_roll_12' },
  { field: 'severityChange', name: 'severity_change' },
  { field: 'activityRate12', name: 'activity_rate_12' },
  { field: 'junctionRatio', name: 'junction_ratio' },
];

// ---------------------------------------------------------------------------
// classifyRisk – exported helper for reuse across services
// ---------------------------------------------------------------------------
export function classifyRisk(score: number): PriorityLevel {
  if (score < 40) return 'low';
  if (score < 60) return 'medium';
  if (score < 80) return 'high';
  return 'critical';
}

// ---------------------------------------------------------------------------
// deriveRecommendedAction – maps a 0-100 risk score and contributing features
//   to a RecommendedAction. contributingFeatures should be sorted by importance
//   descending (caller's responsibility). Takes the top 3 for reason generation.
// ---------------------------------------------------------------------------
export function deriveRecommendedAction(
  riskScore100: number,
  contributingFeatures: ContributingFeature[],
): RecommendedAction {
  const top3FeatureNames = contributingFeatures
    .slice(0, 3)
    .map((f) => f.name.replace(/_/g, ' '))
    .join(', ');

  if (riskScore100 >= 80) {
    return {
      type: 'deploy_patrol_immediate',
      description: 'Deploy patrol within 1 hour',
      reason: `Critical risk due to: ${top3FeatureNames}`,
    };
  }

  if (riskScore100 >= 60) {
    return {
      type: 'deploy_patrol',
      description: 'Deploy patrol within 2 hours',
      reason: `High risk due to: ${top3FeatureNames}`,
    };
  }

  if (riskScore100 >= 40) {
    return {
      type: 'monitor',
      description: 'Schedule monitoring check within 24 hours',
      reason: `Medium risk due to: ${top3FeatureNames}`,
    };
  }

  return {
    type: 'no_action',
    description: 'No immediate action required',
    reason: 'Risk level is within acceptable thresholds',
  };
}

// ---------------------------------------------------------------------------
// Helper – map a PredictionRecord to a Zone object
// ---------------------------------------------------------------------------
function toZone(record: PredictionRecord): Zone {
  return {
    zoneId: record.zoneId,
    h3Index: record.zoneId,
    latitude: record.latitude,
    longitude: record.longitude,
    riskScore100: record.riskScore100,
    expectedSeverity: record.expectedSeverity,
    activityProbability: record.activityProbability,
    priorityLevel: classifyRisk(record.riskScore100),
    locationDescription: record.locationDescription,
    topViolationDetails: dataCache.zoneMetadata.get(record.zoneId)?.topViolationDetails || '',
  };
}

// ---------------------------------------------------------------------------
// getById – returns full ZoneDetail or null if not found
// ---------------------------------------------------------------------------
export function getById(zoneId: string): ZoneDetail | null {
  const record = dataCache.predictions.get(zoneId);
  if (!record) return null;

  // Build SHAP importance lookup (feature → importance)
  const shapMap = new Map<string, number>();
  for (const entry of dataCache.shapImportance) {
    shapMap.set(entry.featureName, entry.importance);
  }

  // Extract contributing features with their values and SHAP importance
  const features: ContributingFeature[] = FEATURE_COLUMNS.map(({ field, name }) => ({
    name,
    value: record[field] as number,
    importance: shapMap.get(name) ?? 0,
  }));

  // Sort by importance descending and take top 10
  features.sort((a, b) => b.importance - a.importance);
  const top10Features = features.slice(0, 10);

  const recommendedAction = deriveRecommendedAction(record.riskScore100, top10Features);

  return {
    ...toZone(record),
    contributingFeatures: top10Features,
    recommendedAction,
  };
}

// ---------------------------------------------------------------------------
// getTopZones – returns first `limit` zones sorted by descending risk_score_100
// ---------------------------------------------------------------------------
export function getTopZones(limit: number): Zone[] {
  return dataCache.topZones.slice(0, limit).map(toZone);
}

// ---------------------------------------------------------------------------
// filterZones – filter by minimum risk and/or priority levels
// ---------------------------------------------------------------------------
export function filterZones(minRisk?: number, levels?: PriorityLevel[]): Zone[] {
  let filtered = dataCache.topZones;

  if (minRisk !== undefined) {
    filtered = filtered.filter((r) => r.riskScore100 >= minRisk);
  }

  if (levels && levels.length > 0) {
    filtered = filtered.filter((r) => levels.includes(classifyRisk(r.riskScore100)));
  }

  return filtered.map(toZone);
}
