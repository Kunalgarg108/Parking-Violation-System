import { describe, it, expect, beforeEach } from 'vitest';
import { getTopSHAPFeatures } from '../../services/shapService.js';
import { dataCache } from '../../services/csvLoader.js';
import type { SHAPFeatureImportance } from '../../types/index.js';

describe('shapService - getTopSHAPFeatures', () => {
  beforeEach(() => {
    dataCache.shapImportance = [];
  });

  it('returns features sorted by importance descending', () => {
    dataCache.shapImportance = [
      { featureName: 'low', importance: 0.1 },
      { featureName: 'high', importance: 0.9 },
      { featureName: 'mid', importance: 0.5 },
    ];

    const result = getTopSHAPFeatures();

    expect(result).toEqual([
      { featureName: 'high', importance: 0.9 },
      { featureName: 'mid', importance: 0.5 },
      { featureName: 'low', importance: 0.1 },
    ]);
  });

  it('caps results at 20 when more features exist', () => {
    const features: SHAPFeatureImportance[] = Array.from({ length: 25 }, (_, i) => ({
      featureName: `feature_${i}`,
      importance: i * 0.04,
    }));
    dataCache.shapImportance = features;

    const result = getTopSHAPFeatures();

    expect(result).toHaveLength(20);
    // The top 20 by importance should start with the highest
    expect(result[0].importance).toBe(0.96); // feature_24
    expect(result[19].importance).toBe(0.20); // feature_5
  });

  it('returns all features when fewer than 20 exist', () => {
    dataCache.shapImportance = [
      { featureName: 'a', importance: 0.3 },
      { featureName: 'b', importance: 0.7 },
    ];

    const result = getTopSHAPFeatures();

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ featureName: 'b', importance: 0.7 });
    expect(result[1]).toEqual({ featureName: 'a', importance: 0.3 });
  });

  it('returns an empty array when no features are available', () => {
    dataCache.shapImportance = [];

    const result = getTopSHAPFeatures();

    expect(result).toEqual([]);
  });

  it('respects a custom limit parameter', () => {
    dataCache.shapImportance = [
      { featureName: 'a', importance: 0.9 },
      { featureName: 'b', importance: 0.8 },
      { featureName: 'c', importance: 0.7 },
      { featureName: 'd', importance: 0.6 },
      { featureName: 'e', importance: 0.5 },
    ];

    const result = getTopSHAPFeatures(3);

    expect(result).toHaveLength(3);
    expect(result[0].featureName).toBe('a');
    expect(result[2].featureName).toBe('c');
  });

  it('does not mutate the original dataCache.shapImportance', () => {
    dataCache.shapImportance = [
      { featureName: 'z', importance: 0.1 },
      { featureName: 'a', importance: 0.9 },
    ];

    getTopSHAPFeatures();

    // Original order should be preserved
    expect(dataCache.shapImportance[0].featureName).toBe('z');
    expect(dataCache.shapImportance[1].featureName).toBe('a');
  });
});
