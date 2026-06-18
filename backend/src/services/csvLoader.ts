import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';
import type { DataCache, PredictionRecord, SHAPFeatureImportance, H3ZoneMetadata, RepeatOffender } from '../types/index';
import { getCachedLocationName } from './locationService';

// ---------------------------------------------------------------------------
// Default data file paths
// ---------------------------------------------------------------------------
const DEFAULT_PREDICTIONS_PATH = path.resolve(__dirname, '../../data/latest_risk_predictions.csv');
const DEFAULT_TOP_ZONES_PATH = path.resolve(__dirname, '../../data/top_enforcement_zones.csv');
const DEFAULT_SHAP_PATH = path.resolve(__dirname, '../../data/shap_feature_importance.csv');
const DEFAULT_METADATA_PATH = path.resolve(__dirname, '../../data/h3_zone_metadata.csv');
const DEFAULT_REPEAT_OFFENDERS_PATH = path.resolve(__dirname, '../../data/repeat_offenders.csv');

// ---------------------------------------------------------------------------
// Required header columns for each CSV
// ---------------------------------------------------------------------------
const REQUIRED_PREDICTION_HEADERS = ['h3_cell', 'risk_score_100', 'expected_severity'];
const REQUIRED_ENFORCEMENT_HEADERS = ['h3_cell', 'risk_score_100', 'expected_severity'];
const REQUIRED_SHAP_HEADERS = ['feature', 'importance'];
const REQUIRED_METADATA_HEADERS = ['h3_cell', 'location_name'];
const REQUIRED_REPEAT_OFFENDER_HEADERS = ['vehicle_number', 'violation_count'];

// ---------------------------------------------------------------------------
// In-memory singleton cache
// ---------------------------------------------------------------------------
export const dataCache: DataCache = {
  predictions: new Map<string, PredictionRecord>(),
  topZones: [],
  shapImportance: [],
  zoneMetadata: new Map<string, H3ZoneMetadata>(),
  repeatOffenders: new Map<string, RepeatOffender>(),
  lastLoaded: new Date(0),
  status: 'loading',
  errors: [],
};

// ---------------------------------------------------------------------------
// Helper – validate that all required headers are present
// ---------------------------------------------------------------------------
function validateHeaders(headers: string[], required: string[], fileName: string): void {
  const missing = required.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    throw new Error(
      `CSV header validation failed for "${fileName}": missing required columns [${missing.join(', ')}]`,
    );
  }
}

// ---------------------------------------------------------------------------
// Helper – parse a CSV file from disk synchronously and return raw records
// ---------------------------------------------------------------------------
function parseCsvFile(filePath: string): Papa.ParseResult<Record<string, string>> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
  });
  return result;
}

// ---------------------------------------------------------------------------
// loadPredictions – parses latest_risk_predictions.csv
//   • Validates required headers
//   • Skips rows with empty h3_cell or non-numeric risk_score_100 / expected_severity
//   • Populates dataCache.predictions (Map) and dataCache.topZones (sorted desc)
// ---------------------------------------------------------------------------
export function loadPredictions(filePath: string = DEFAULT_PREDICTIONS_PATH): void {
  const result = parseCsvFile(filePath);

  const headers = result.meta.fields ?? [];
  validateHeaders(headers, REQUIRED_PREDICTION_HEADERS, path.basename(filePath));

  const predictions = new Map<string, PredictionRecord>();

  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i];
    const rowNum = i + 2; // 1-based, +1 for header row

    // Validate h3_cell (maps to internal zoneId)
    const zoneId = (row['h3_cell'] ?? '').trim();
    if (!zoneId) {
      console.warn(`[csvLoader] Row ${rowNum}: skipping – empty h3_cell`);
      continue;
    }

    // Validate risk_score_100
    const riskScore100Raw = row['risk_score_100'];
    const riskScore100 = Number(riskScore100Raw);
    if (riskScore100Raw === undefined || riskScore100Raw.trim() === '' || isNaN(riskScore100)) {
      console.warn(`[csvLoader] Row ${rowNum}: skipping h3_cell="${zoneId}" – non-numeric risk_score_100 "${riskScore100Raw}"`);
      continue;
    }

    // Validate expected_severity
    const expectedSeverityRaw = row['expected_severity'];
    const expectedSeverity = Number(expectedSeverityRaw);
    if (expectedSeverityRaw === undefined || expectedSeverityRaw.trim() === '' || isNaN(expectedSeverity)) {
      console.warn(`[csvLoader] Row ${rowNum}: skipping h3_cell="${zoneId}" – non-numeric expected_severity "${expectedSeverityRaw}"`);
      continue;
    }

    const record: PredictionRecord = {
      zoneId,
      latitude: Number(row['lat']) || 0,
      longitude: Number(row['lon']) || 0,
      riskScore100,
      expectedSeverity,
      activityProbability: Number(row['activity_probability']) || 0,
      violations: Number(row['violations']) || 0,
      severity: Number(row['severity']) || 0,
      avgSeverity: Number(row['avg_severity']) || 0,
      uniqueVehicles: Number(row['unique_vehicles']) || 0,
      junctionCount: Number(row['junction_count']) || 0,
      avgRepeatOffender: Number(row['avg_repeat_offender']) || 0,
      hour: Number(row['hour']) || 0,
      dayOfWeek: Number(row['day_of_week']) || 0,
      month: Number(row['month']) || 0,
      isWeekend: Number(row['is_weekend']) || 0,
      cellDensity: Number(row['cell_density']) || 0,
      severityLag1: Number(row['severity_lag_1']) || 0,
      severityLag12: Number(row['severity_lag_12']) || 0,
      severityLag84: Number(row['severity_lag_84']) || 0,
      junctionLag1: Number(row['junction_lag_1']) || 0,
      repeatLag1: Number(row['repeat_lag_1']) || 0,
      severityRoll3: Number(row['severity_roll_3']) || 0,
      severityRoll12: Number(row['severity_roll_12']) || 0,
      severityChange: Number(row['severity_change']) || 0,
      activityRate12: Number(row['activity_rate_12']) || 0,
      junctionRatio: Number(row['junction_ratio']) || 0,
      timestamp: row['time_bucket'] ?? '',
      locationDescription: dataCache.zoneMetadata.get(zoneId)?.locationName || getCachedLocationName(zoneId, Number(row['lat']) || 0, Number(row['lon']) || 0),
    };

    predictions.set(zoneId, record);
  }

  // Sort by riskScore100 descending for topZones
  const topZones = Array.from(predictions.values()).sort(
    (a, b) => b.riskScore100 - a.riskScore100,
  );

  dataCache.predictions = predictions;
  dataCache.topZones = topZones;
}

// ---------------------------------------------------------------------------
// loadEnforcementZones – parses top_enforcement_zones.csv
//   • Builds a PredictionRecord array (subset of fields) from enforcement CSV
//   • Returns the parsed records (does not update dataCache directly – 
//     the caller may use these or merge them; we update topZones from predictions)
//   Note: This function is exposed for extensibility but the main topZones
//         population comes from loadPredictions().
// ---------------------------------------------------------------------------
export function loadEnforcementZones(filePath: string = DEFAULT_TOP_ZONES_PATH): PredictionRecord[] {
  const result = parseCsvFile(filePath);

  const headers = result.meta.fields ?? [];
  validateHeaders(headers, REQUIRED_ENFORCEMENT_HEADERS, path.basename(filePath));

  const rows: PredictionRecord[] = [];

  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i];
    const rowNum = i + 2;

    const zoneId = (row['h3_cell'] ?? '').trim();
    if (!zoneId) {
      console.warn(`[csvLoader] enforcement row ${rowNum}: skipping – empty h3_cell`);
      continue;
    }

    const riskScore100Raw = row['risk_score_100'];
    const riskScore100 = Number(riskScore100Raw);
    if (riskScore100Raw === undefined || riskScore100Raw.trim() === '' || isNaN(riskScore100)) {
      console.warn(`[csvLoader] enforcement row ${rowNum}: skipping h3_cell="${zoneId}" – non-numeric risk_score_100 "${riskScore100Raw}"`);
      continue;
    }

    const expectedSeverityRaw = row['expected_severity'];
    const expectedSeverity = Number(expectedSeverityRaw);
    if (expectedSeverityRaw === undefined || expectedSeverityRaw.trim() === '' || isNaN(expectedSeverity)) {
      console.warn(`[csvLoader] enforcement row ${rowNum}: skipping h3_cell="${zoneId}" – non-numeric expected_severity "${expectedSeverityRaw}"`);
      continue;
    }

    // PredictionRecord from enforcement CSV (uses available columns)
    const record: PredictionRecord = {
      zoneId,
      latitude: Number(row['lat']) || 0,
      longitude: Number(row['lon']) || 0,
      riskScore100,
      expectedSeverity,
      activityProbability: Number(row['activity_probability']) || 0,
      violations: 0,
      severity: 0,
      avgSeverity: 0,
      uniqueVehicles: 0,
      junctionCount: Number(row['junction_count']) || 0,
      avgRepeatOffender: Number(row['avg_repeat_offender']) || 0,
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
      locationDescription: dataCache.zoneMetadata.get(zoneId)?.locationName || getCachedLocationName(zoneId, Number(row['lat']) || 0, Number(row['lon']) || 0),
    };

    rows.push(record);
  }

  return rows;
}

// ---------------------------------------------------------------------------
// loadSHAPImportance – parses shap_feature_importance.csv
//   • Validates required headers (feature, importance)
//   • Populates dataCache.shapImportance
// ---------------------------------------------------------------------------
export function loadSHAPImportance(filePath: string = DEFAULT_SHAP_PATH): void {
  const result = parseCsvFile(filePath);

  const headers = result.meta.fields ?? [];
  validateHeaders(headers, REQUIRED_SHAP_HEADERS, path.basename(filePath));

  const shapImportance: SHAPFeatureImportance[] = [];

  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i];
    const rowNum = i + 2;

    const featureName = (row['feature'] ?? '').trim();
    if (!featureName) {
      console.warn(`[csvLoader] SHAP row ${rowNum}: skipping – empty feature`);
      continue;
    }

    const importanceRaw = row['importance'];
    const importance = Number(importanceRaw);
    if (importanceRaw === undefined || importanceRaw.trim() === '' || isNaN(importance)) {
      console.warn(`[csvLoader] SHAP row ${rowNum}: skipping feature="${featureName}" – non-numeric importance "${importanceRaw}"`);
      continue;
    }

    shapImportance.push({ featureName, importance });
  }

  dataCache.shapImportance = shapImportance;
}

// ---------------------------------------------------------------------------
// loadZoneMetadata – parses h3_zone_metadata.csv
//   • Validates required headers (h3_cell, location_name)
//   • Populates dataCache.zoneMetadata Map keyed by h3_cell
// ---------------------------------------------------------------------------
export function loadZoneMetadata(filePath: string = DEFAULT_METADATA_PATH): void {
  const result = parseCsvFile(filePath);

  const headers = result.meta.fields ?? [];
  validateHeaders(headers, REQUIRED_METADATA_HEADERS, path.basename(filePath));

  const metadata = new Map<string, H3ZoneMetadata>();

  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i];
    const rowNum = i + 2;

    const h3Cell = (row['h3_cell'] ?? '').trim();
    if (!h3Cell) {
      console.warn(`[csvLoader] metadata row ${rowNum}: skipping – empty h3_cell`);
      continue;
    }

    const locationName = (row['location_name'] ?? '').trim();
    if (!locationName) {
      console.warn(`[csvLoader] metadata row ${rowNum}: skipping h3_cell="${h3Cell}" – empty location_name`);
      continue;
    }

    metadata.set(h3Cell, {
      h3Cell,
      locationName,
      lat: Number(row['lat']) || 0,
      lon: Number(row['lon']) || 0,
      topViolationDetails: (row['top_violation_details'] ?? '').trim(),
    });
  }

  dataCache.zoneMetadata = metadata;
}

// ---------------------------------------------------------------------------
// loadRepeatOffenders – parses repeat_offenders.csv
//   • Validates required headers (vehicle_number, violation_count)
//   • Populates dataCache.repeatOffenders Map keyed by vehicle_number
// ---------------------------------------------------------------------------
export function loadRepeatOffenders(filePath: string = DEFAULT_REPEAT_OFFENDERS_PATH): void {
  const result = parseCsvFile(filePath);

  const headers = result.meta.fields ?? [];
  validateHeaders(headers, REQUIRED_REPEAT_OFFENDER_HEADERS, path.basename(filePath));

  const offenders = new Map<string, RepeatOffender>();

  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i];
    const rowNum = i + 2;

    const vehicleNumber = (row['vehicle_number'] ?? '').trim();
    if (!vehicleNumber) {
      console.warn(`[csvLoader] repeat offenders row ${rowNum}: skipping – empty vehicle_number`);
      continue;
    }

    const violationCountRaw = row['violation_count'];
    const violationCount = Number(violationCountRaw);
    if (violationCountRaw === undefined || violationCountRaw.trim() === '' || isNaN(violationCount)) {
      console.warn(`[csvLoader] repeat offenders row ${rowNum}: skipping vehicle="${vehicleNumber}" – non-numeric violation_count "${violationCountRaw}"`);
      continue;
    }

    offenders.set(vehicleNumber, {
      vehicleNumber,
      vehicleType: (row['vehicle_type'] ?? '').trim(),
      violationCount,
      lastSeen: (row['last_seen'] ?? '').trim(),
      mostCommonArea: (row['most_common_area'] ?? '').trim(),
      mostCommonViolations: (row['most_common_violations'] ?? '').trim(),
    });
  }

  dataCache.repeatOffenders = offenders;
}

// ---------------------------------------------------------------------------
// initializeCache – load all CSVs and mark cache ready (or error on failure)
// ---------------------------------------------------------------------------
export function initializeCache(
  predictionsPath: string = DEFAULT_PREDICTIONS_PATH,
  topZonesPath: string = DEFAULT_TOP_ZONES_PATH,
  shapPath: string = DEFAULT_SHAP_PATH,
  metadataPath: string = DEFAULT_METADATA_PATH,
  repeatOffendersPath: string = DEFAULT_REPEAT_OFFENDERS_PATH,
): void {
  dataCache.status = 'loading';
  dataCache.errors = [];

  try {
    loadZoneMetadata(metadataPath);
    loadRepeatOffenders(repeatOffendersPath);
    loadPredictions(predictionsPath);
    loadEnforcementZones(topZonesPath); // loads but topZones driven by predictions sort
    loadSHAPImportance(shapPath);
    dataCache.lastLoaded = new Date();
    dataCache.status = 'ready';
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    dataCache.errors.push(message);
    dataCache.status = 'error';
    console.error(`[csvLoader] Failed to initialize cache: ${message}`);
  }
}
