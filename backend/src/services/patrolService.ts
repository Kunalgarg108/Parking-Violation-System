import { dataCache } from './csvLoader';
import { classifyRisk } from './zoneService';
import type { PatrolAssignment, PatrolAssignmentResponse } from '../types/index';

// ---------------------------------------------------------------------------
// validateUnitCount – accepts only integers 1–50 inclusive
// ---------------------------------------------------------------------------
export function validateUnitCount(input: unknown): number {
  const num = typeof input === 'string' ? Number(input) : input;

  if (typeof num !== 'number' || isNaN(num)) {
    throw new Error('Unit count must be a numeric value');
  }

  if (!Number.isInteger(num)) {
    throw new Error('Unit count must be an integer');
  }

  if (num < 1 || num > 50) {
    throw new Error('Unit count must be between 1 and 50');
  }

  return num;
}

// ---------------------------------------------------------------------------
// assignPatrols – filter zones >= 40 risk, select top N, label Unit 1..K
// ---------------------------------------------------------------------------
export function assignPatrols(unitCount: number): PatrolAssignmentResponse {
  // Filter topZones (already sorted descending by riskScore100) where riskScore100 >= 40
  const qualifyingZones = dataCache.topZones.filter(
    (zone) => zone.riskScore100 >= 40,
  );

  const totalQualifyingZones = qualifyingZones.length;

  // Select top min(unitCount, qualifyingCount) zones
  const selectedCount = Math.min(unitCount, totalQualifyingZones);
  const selected = qualifyingZones.slice(0, selectedCount);

  // Build assignments with labels "Unit 1" through "Unit K"
  const assignments: PatrolAssignment[] = selected.map((zone, index) => ({
    unitLabel: `Unit ${index + 1}`,
    zoneId: zone.zoneId,
    riskScore100: zone.riskScore100,
    expectedSeverity: zone.expectedSeverity,
    priorityLevel: classifyRisk(zone.riskScore100),
  }));

  // Detect shortfall
  const shortfall =
    totalQualifyingZones < unitCount
      ? unitCount - totalQualifyingZones
      : null;

  return {
    assignments,
    totalQualifyingZones,
    shortfall,
  };
}
