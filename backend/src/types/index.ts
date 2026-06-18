// Priority level classification (4 levels)
export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

// Data loading state
export type DataState = 'ready' | 'loading' | 'error';

// Core zone information
export interface Zone {
  zoneId: string;
  h3Index: string;
  latitude: number;
  longitude: number;
  riskScore100: number;        // 0–100 scale
  expectedSeverity: number;    // XGBRegressor prediction
  activityProbability: number; // 0.0–1.0
  priorityLevel: PriorityLevel;
  locationDescription: string;
  topViolationDetails?: string;
}

// Zone with SHAP-based contributing features and recommended action
export interface ZoneDetail extends Zone {
  contributingFeatures: ContributingFeature[];
  recommendedAction: RecommendedAction;
}

export interface ContributingFeature {
  name: string;
  value: number;
  importance: number;
}

export interface RecommendedAction {
  type: 'deploy_patrol_immediate' | 'deploy_patrol' | 'monitor' | 'no_action';
  description: string;
  reason: string;
}

export interface SHAPFeatureImportance {
  featureName: string;
  importance: number;
}

// Dashboard summary for the main overview
export interface DashboardData {
  totalActiveZones: number;
  averageRiskScore100: number;  // 0–100 to one decimal place
  totalCriticalZones: number;   // risk_score_100 >= 80
  totalHighRiskZones: number;   // risk_score_100 >= 60
}

// H3 Zone Metadata (from h3_zone_metadata.csv)
export interface H3ZoneMetadata {
  h3Cell: string;
  locationName: string;
  lat: number;
  lon: number;
  topViolationDetails: string;
}

// Repeat offender data
export interface RepeatOffender {
  vehicleNumber: string;
  vehicleType: string;
  violationCount: number;
  lastSeen: string;
  mostCommonArea: string;
  mostCommonViolations: string;
}

// Patrol assignment types
export interface PatrolAssignment {
  unitLabel: string;
  zoneId: string;
  riskScore100: number;
  expectedSeverity: number;
  priorityLevel: PriorityLevel;
}

export interface PatrolAssignmentResponse {
  assignments: PatrolAssignment[];
  totalQualifyingZones: number;
  shortfall: number | null;
}

// Analytics types
export interface HistogramBin {
  binStart: number;
  binEnd: number;
  count: number;
}

export interface PriorityDistributionData {
  low: number;      // 0–40
  medium: number;   // 40–60
  high: number;     // 60–80
  critical: number; // 80–100
}

export interface AnalyticsData {
  riskHistogram: HistogramBin[];
  priorityDistribution: PriorityDistributionData;
  shapFeatureImportance: SHAPFeatureImportance[];
}

// Raw prediction record from CSV (backend-internal)
export interface PredictionRecord {
  zoneId: string;
  latitude: number;
  longitude: number;
  riskScore100: number;
  expectedSeverity: number;
  activityProbability: number;
  violations: number;
  severity: number;
  avgSeverity: number;
  uniqueVehicles: number;
  junctionCount: number;
  avgRepeatOffender: number;
  hour: number;
  dayOfWeek: number;
  month: number;
  isWeekend: number;
  cellDensity: number;
  severityLag1: number;
  severityLag12: number;
  severityLag84: number;
  junctionLag1: number;
  repeatLag1: number;
  severityRoll3: number;
  severityRoll12: number;
  severityChange: number;
  activityRate12: number;
  junctionRatio: number;
  timestamp: string;
  locationDescription: string;
}

// In-memory cache structure (backend-internal)
export interface DataCache {
  predictions: Map<string, PredictionRecord>;  // h3_cell (as zoneId) → full record
  topZones: PredictionRecord[];                // pre-sorted by risk_score_100 desc
  shapImportance: SHAPFeatureImportance[];     // global SHAP importance array
  zoneMetadata: Map<string, H3ZoneMetadata>;   // h3_cell → zone metadata
  repeatOffenders: Map<string, RepeatOffender>; // vehicle_number → offender record
  lastLoaded: Date;
  status: DataState;
  errors: string[];
}
