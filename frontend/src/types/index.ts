// Priority level classification (4 levels)
export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

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

// Repeat offender types
export interface RepeatOffender {
  vehicleNumber: string;
  vehicleType: string;
  violationCount: number;
  lastSeen: string;
  mostCommonArea: string;
  mostCommonViolations: string;
}

export interface RepeatOffendersResponse {
  offenders: RepeatOffender[];
  total: number;
  page: number;
  pageSize: number;
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
