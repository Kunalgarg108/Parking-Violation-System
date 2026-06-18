import { dataCache } from './csvLoader';
import type { SHAPFeatureImportance } from '../types/index';

/**
 * Returns SHAP feature importances sorted by importance descending,
 * capped at the specified limit.
 *
 * @param limit - Maximum number of features to return (default 20)
 * @returns Sorted and capped array of SHAPFeatureImportance
 */
export function getTopSHAPFeatures(limit = 20): SHAPFeatureImportance[] {
  const sorted = [...dataCache.shapImportance].sort(
    (a, b) => b.importance - a.importance
  );
  return sorted.slice(0, limit);
}
