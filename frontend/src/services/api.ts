import { apiClient } from '../hooks/useApiClient';
import type {
  DashboardData,
  Zone,
  ZoneDetail,
  PatrolAssignmentResponse,
  AnalyticsData,
  SHAPFeatureImportance,
  RepeatOffendersResponse,
  PriorityLevel,
} from '../types';

/** Standard API response envelope */
interface ApiSuccessResponse<T> {
  status: 'success';
  data: T;
}

interface ApiErrorResponse {
  status: 'error';
  error: {
    code: string;
    message: string;
  };
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Unwraps the response envelope and returns the data payload.
 * Throws an Error if the response indicates failure.
 */
function unwrapResponse<T>(response: ApiResponse<T>): T {
  if (response.status === 'error') {
    throw new Error(response.error.message);
  }
  return response.data;
}

/** Fetch dashboard summary data */
export async function fetchDashboard(): Promise<DashboardData> {
  const response = await apiClient.get<ApiResponse<DashboardData>>('/api/dashboard');
  return unwrapResponse(response.data);
}

/** Fetch zones with optional filters */
export async function fetchZones(params?: {
  min_risk?: number;
  level?: PriorityLevel;
}): Promise<Zone[]> {
  const response = await apiClient.get<ApiResponse<Zone[]>>('/api/zones', { params });
  return unwrapResponse(response.data);
}

/** Fetch a single zone's detail by ID */
export async function fetchZoneDetail(zoneId: string): Promise<ZoneDetail> {
  const response = await apiClient.get<ApiResponse<ZoneDetail>>(`/api/zones/${zoneId}`);
  return unwrapResponse(response.data);
}

/** Fetch patrol assignments for a given number of units */
export async function fetchPatrolAssignments(units: number): Promise<PatrolAssignmentResponse> {
  const response = await apiClient.get<ApiResponse<PatrolAssignmentResponse>>(
    '/api/patrol/assignments',
    { params: { units } }
  );
  return unwrapResponse(response.data);
}

/** Fetch analytics data (histogram, distribution, SHAP) */
export async function fetchAnalytics(): Promise<AnalyticsData> {
  const response = await apiClient.get<ApiResponse<AnalyticsData>>('/api/analytics');
  return unwrapResponse(response.data);
}

/** Fetch SHAP feature importance data */
export async function fetchSHAP(): Promise<SHAPFeatureImportance[]> {
  const response = await apiClient.get<ApiResponse<SHAPFeatureImportance[]>>('/api/shap');
  return unwrapResponse(response.data);
}

/** Fetch repeat offenders with optional search and pagination */
export async function fetchRepeatOffenders(params?: {
  search?: string;
  page?: number;
  pageSize?: number;
  sortOrder?: 'asc' | 'desc';
}): Promise<RepeatOffendersResponse> {
  const response = await apiClient.get<ApiResponse<RepeatOffendersResponse>>(
    '/api/repeat-offenders',
    { params }
  );
  return unwrapResponse(response.data);
}
