import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { loadPredictions, loadSHAPImportance, loadEnforcementZones, dataCache } from '../../services/csvLoader';

// Helper to create a temp CSV file and return its path
function writeTempCsv(filename: string, content: string): string {
  const tmpDir = path.resolve(__dirname, '../../../tmp_test_data');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  const filePath = path.join(tmpDir, filename);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

// Cleanup temp dir after all tests
import { afterAll } from 'vitest';
afterAll(() => {
  const tmpDir = path.resolve(__dirname, '../../../tmp_test_data');
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

describe('csvLoader – loadPredictions', () => {
  beforeEach(() => {
    dataCache.predictions = new Map();
    dataCache.topZones = [];
    dataCache.shapImportance = [];
    dataCache.zoneMetadata = new Map();
    dataCache.repeatOffenders = new Map();
    dataCache.errors = [];
    dataCache.status = 'loading';
  });

  it('should parse a valid predictions CSV and populate predictions Map and topZones', () => {
    const csv = [
      'h3_cell,time_bucket,violations,severity,avg_severity,unique_vehicles,junction_count,avg_repeat_offender,h3_id,hour,day_of_week,month,is_weekend,severity_lag_1,severity_lag_12,severity_lag_84,severity_roll_3,severity_roll_12,junction_lag_1,repeat_lag_1,hour_sin,hour_cos,severity_change,activity_rate_12,junction_ratio,cell_density,activity_probability,expected_severity,risk_score,risk_score_100,priority,lat,lon',
      'zone_a,2024-01-15T10:00:00Z,10,5,3,8,2,0.1,0,14,2,6,0,4,3,2,3.5,3.0,1,0.1,0.5,0.5,0.5,0.6,0.4,1.2,0.9,12.3,0.5,85.5,Critical,40.71,-74.00',
      'zone_b,2024-01-15T10:00:00Z,20,10,6,12,4,0.2,1,10,3,6,0,8,7,5,7.5,7.0,3,0.15,0.5,0.5,1.0,0.7,0.5,1.5,0.95,18.1,0.8,92.0,Critical,40.72,-73.99',
    ].join('\n');

    const filePath = writeTempCsv('valid_predictions.csv', csv);
    loadPredictions(filePath);

    expect(dataCache.predictions.size).toBe(2);
    expect(dataCache.predictions.has('zone_a')).toBe(true);
    expect(dataCache.predictions.has('zone_b')).toBe(true);

    const zoneA = dataCache.predictions.get('zone_a')!;
    expect(zoneA.riskScore100).toBe(85.5);
    expect(zoneA.expectedSeverity).toBe(12.3);
    expect(zoneA.latitude).toBe(40.71);
    expect(zoneA.timestamp).toBe('2024-01-15T10:00:00Z');

    // topZones should be sorted descending by riskScore100
    expect(dataCache.topZones.length).toBe(2);
    expect(dataCache.topZones[0].zoneId).toBe('zone_b'); // 92.0
    expect(dataCache.topZones[1].zoneId).toBe('zone_a'); // 85.5
  });

  it('should throw when required headers are missing', () => {
    const csv = [
      'h3_cell,lat,lon',
      'zone_a,40.71,-74.00',
    ].join('\n');

    const filePath = writeTempCsv('missing_headers.csv', csv);
    expect(() => loadPredictions(filePath)).toThrowError(/missing required columns.*risk_score_100/);
  });

  it('should skip rows with empty h3_cell and log a warning', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const csv = [
      'h3_cell,time_bucket,violations,severity,avg_severity,unique_vehicles,junction_count,avg_repeat_offender,h3_id,hour,day_of_week,month,is_weekend,severity_lag_1,severity_lag_12,severity_lag_84,severity_roll_3,severity_roll_12,junction_lag_1,repeat_lag_1,hour_sin,hour_cos,severity_change,activity_rate_12,junction_ratio,cell_density,activity_probability,expected_severity,risk_score,risk_score_100,priority,lat,lon',
      ',2024-01-15T10:00:00Z,10,5,3,8,2,0.1,0,14,2,6,0,4,3,2,3.5,3.0,1,0.1,0.5,0.5,0.5,0.6,0.4,1.2,0.9,12.3,0.5,85.5,Critical,40.71,-74.00',
      'zone_b,2024-01-15T10:00:00Z,20,10,6,12,4,0.2,1,10,3,6,0,8,7,5,7.5,7.0,3,0.15,0.5,0.5,1.0,0.7,0.5,1.5,0.95,18.1,0.8,92.0,Critical,40.72,-73.99',
    ].join('\n');

    const filePath = writeTempCsv('empty_h3_cell.csv', csv);
    loadPredictions(filePath);

    expect(dataCache.predictions.size).toBe(1);
    expect(dataCache.predictions.has('zone_b')).toBe(true);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Row 2'));
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('empty h3_cell'));

    warnSpy.mockRestore();
  });

  it('should skip rows with non-numeric risk_score_100', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const csv = [
      'h3_cell,time_bucket,violations,severity,avg_severity,unique_vehicles,junction_count,avg_repeat_offender,h3_id,hour,day_of_week,month,is_weekend,severity_lag_1,severity_lag_12,severity_lag_84,severity_roll_3,severity_roll_12,junction_lag_1,repeat_lag_1,hour_sin,hour_cos,severity_change,activity_rate_12,junction_ratio,cell_density,activity_probability,expected_severity,risk_score,risk_score_100,priority,lat,lon',
      'zone_a,2024-01-15T10:00:00Z,10,5,3,8,2,0.1,0,14,2,6,0,4,3,2,3.5,3.0,1,0.1,0.5,0.5,0.5,0.6,0.4,1.2,0.9,12.3,0.5,NOT_A_NUMBER,Critical,40.71,-74.00',
      'zone_b,2024-01-15T10:00:00Z,20,10,6,12,4,0.2,1,10,3,6,0,8,7,5,7.5,7.0,3,0.15,0.5,0.5,1.0,0.7,0.5,1.5,0.95,18.1,0.8,92.0,Critical,40.72,-73.99',
    ].join('\n');

    const filePath = writeTempCsv('bad_risk_score.csv', csv);
    loadPredictions(filePath);

    expect(dataCache.predictions.size).toBe(1);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('non-numeric risk_score_100'));

    warnSpy.mockRestore();
  });

  it('should skip rows with non-numeric expected_severity', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const csv = [
      'h3_cell,time_bucket,violations,severity,avg_severity,unique_vehicles,junction_count,avg_repeat_offender,h3_id,hour,day_of_week,month,is_weekend,severity_lag_1,severity_lag_12,severity_lag_84,severity_roll_3,severity_roll_12,junction_lag_1,repeat_lag_1,hour_sin,hour_cos,severity_change,activity_rate_12,junction_ratio,cell_density,activity_probability,expected_severity,risk_score,risk_score_100,priority,lat,lon',
      'zone_a,2024-01-15T10:00:00Z,10,5,3,8,2,0.1,0,14,2,6,0,4,3,2,3.5,3.0,1,0.1,0.5,0.5,0.5,0.6,0.4,1.2,0.9,BAD,0.5,85.5,Critical,40.71,-74.00',
    ].join('\n');

    const filePath = writeTempCsv('bad_severity.csv', csv);
    loadPredictions(filePath);

    expect(dataCache.predictions.size).toBe(0);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('non-numeric expected_severity'));

    warnSpy.mockRestore();
  });

  it('should handle empty CSV file (headers only)', () => {
    const csv = 'h3_cell,time_bucket,violations,severity,avg_severity,unique_vehicles,junction_count,avg_repeat_offender,h3_id,hour,day_of_week,month,is_weekend,severity_lag_1,severity_lag_12,severity_lag_84,severity_roll_3,severity_roll_12,junction_lag_1,repeat_lag_1,hour_sin,hour_cos,severity_change,activity_rate_12,junction_ratio,cell_density,activity_probability,expected_severity,risk_score,risk_score_100,priority,lat,lon';

    const filePath = writeTempCsv('empty_predictions.csv', csv);
    loadPredictions(filePath);

    expect(dataCache.predictions.size).toBe(0);
    expect(dataCache.topZones.length).toBe(0);
  });
});

describe('csvLoader – loadSHAPImportance', () => {
  beforeEach(() => {
    dataCache.shapImportance = [];
  });

  it('should parse a valid SHAP importance CSV', () => {
    const csv = [
      'feature,importance',
      'violations,0.185',
      'severity,0.142',
      'avg_severity,0.098',
    ].join('\n');

    const filePath = writeTempCsv('valid_shap.csv', csv);
    loadSHAPImportance(filePath);

    expect(dataCache.shapImportance.length).toBe(3);
    expect(dataCache.shapImportance[0]).toEqual({ featureName: 'violations', importance: 0.185 });
    expect(dataCache.shapImportance[1]).toEqual({ featureName: 'severity', importance: 0.142 });
    expect(dataCache.shapImportance[2]).toEqual({ featureName: 'avg_severity', importance: 0.098 });
  });

  it('should throw when required headers are missing', () => {
    const csv = [
      'name,value',
      'violations,0.185',
    ].join('\n');

    const filePath = writeTempCsv('bad_shap_headers.csv', csv);
    expect(() => loadSHAPImportance(filePath)).toThrowError(/missing required columns.*feature/);
  });

  it('should skip rows with non-numeric importance', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const csv = [
      'feature,importance',
      'violations,NOT_NUMERIC',
      'severity,0.142',
    ].join('\n');

    const filePath = writeTempCsv('bad_importance.csv', csv);
    loadSHAPImportance(filePath);

    expect(dataCache.shapImportance.length).toBe(1);
    expect(dataCache.shapImportance[0].featureName).toBe('severity');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('non-numeric importance'));

    warnSpy.mockRestore();
  });

  it('should handle empty CSV file (headers only)', () => {
    const csv = 'feature,importance';

    const filePath = writeTempCsv('empty_shap.csv', csv);
    loadSHAPImportance(filePath);

    expect(dataCache.shapImportance.length).toBe(0);
  });
});

describe('csvLoader – loadEnforcementZones', () => {
  it('should parse enforcement zones and return records', () => {
    const csv = [
      'h3_cell,activity_probability,expected_severity,risk_score,risk_score_100,priority,junction_count,avg_repeat_offender,lat,lon',
      'zone_1,0.95,18.5,3.0,92.1,Critical,2,0.1,40.71,-74.00',
      'zone_2,0.88,15.2,2.5,87.3,Critical,1,0.05,40.72,-73.99',
    ].join('\n');

    const filePath = writeTempCsv('valid_enforcement.csv', csv);
    const result = loadEnforcementZones(filePath);

    expect(result.length).toBe(2);
    expect(result[0].zoneId).toBe('zone_1');
    expect(result[0].riskScore100).toBe(92.1);
    expect(result[0].expectedSeverity).toBe(18.5);
    expect(result[0].latitude).toBe(40.71);
    expect(result[0].longitude).toBe(-74.00);
    expect(result[0].activityProbability).toBe(0.95);
    expect(result[1].zoneId).toBe('zone_2');
  });

  it('should skip rows with empty h3_cell', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const csv = [
      'h3_cell,activity_probability,expected_severity,risk_score,risk_score_100,priority,junction_count,avg_repeat_offender,lat,lon',
      ',0.95,18.5,3.0,92.1,Critical,2,0.1,40.71,-74.00',
      'zone_2,0.88,15.2,2.5,87.3,Critical,1,0.05,40.72,-73.99',
    ].join('\n');

    const filePath = writeTempCsv('enforcement_empty_h3_cell.csv', csv);
    const result = loadEnforcementZones(filePath);

    expect(result.length).toBe(1);
    expect(result[0].zoneId).toBe('zone_2');
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});
