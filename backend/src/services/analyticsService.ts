import { dataCache } from './csvLoader';
import { classifyRisk } from './zoneService';
import type { HistogramBin, PriorityDistributionData } from '../types/index';

// ---------------------------------------------------------------------------
// computeRiskHistogram – creates 10 bins of width 10 spanning 0–100 and
// assigns each zone's riskScore100 to the correct bin.
// ---------------------------------------------------------------------------
export function computeRiskHistogram(): HistogramBin[] {
  const BIN_COUNT = 10;
  const BIN_WIDTH = 10;

  // Initialize bins: 0-10, 10-20, ..., 90-100
  const bins: HistogramBin[] = Array.from({ length: BIN_COUNT }, (_, i) => ({
    binStart: i * BIN_WIDTH,
    binEnd: (i + 1) * BIN_WIDTH,
    count: 0,
  }));

  for (const zone of dataCache.topZones) {
    // Determine which bin the score falls into
    let binIndex = Math.floor(zone.riskScore100 / BIN_WIDTH);
    // Clamp: a score of exactly 100 goes into the last bin (90-100)
    if (binIndex >= BIN_COUNT) {
      binIndex = BIN_COUNT - 1;
    }
    bins[binIndex].count += 1;
  }

  return bins;
}

// ---------------------------------------------------------------------------
// computePriorityDistribution – counts zones per priority level using the
// classifyRisk thresholds: low (<40), medium (40-<60), high (60-<80),
// critical (>=80).
// ---------------------------------------------------------------------------
export function computePriorityDistribution(): PriorityDistributionData {
  const distribution: PriorityDistributionData = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  for (const zone of dataCache.topZones) {
    const priority = classifyRisk(zone.riskScore100);
    distribution[priority] += 1;
  }

  return distribution;
}
