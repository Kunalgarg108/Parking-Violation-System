import { describe, it, expect } from 'vitest';
import {
  formatPercentage,
  formatRiskScore,
  formatSeverity,
  formatCoordinates,
  formatCount,
} from '../../utils/formatters';

describe('frontend/utils/formatters', () => {
  describe('formatPercentage', () => {
    it('formats with 1 decimal and % suffix', () => {
      expect(formatPercentage(73.2456)).toBe('73.2%');
      expect(formatPercentage(0)).toBe('0.0%');
      expect(formatPercentage(100)).toBe('100.0%');
    });
  });

  describe('formatRiskScore', () => {
    it('formats with 1 decimal place', () => {
      expect(formatRiskScore(78.456)).toBe('78.5');
      expect(formatRiskScore(0)).toBe('0.0');
      expect(formatRiskScore(78.5)).toBe('78.5');
    });
  });

  describe('formatSeverity', () => {
    it('formats with 2 decimal places', () => {
      expect(formatSeverity(12.34)).toBe('12.34');
      expect(formatSeverity(12.3)).toBe('12.30');
      expect(formatSeverity(0)).toBe('0.00');
    });
  });

  describe('formatCoordinates', () => {
    it('formats with 6 decimal places', () => {
      expect(formatCoordinates(40.712776)).toBe('40.712776');
      expect(formatCoordinates(40.7)).toBe('40.700000');
      expect(formatCoordinates(-73.935242)).toBe('-73.935242');
    });
  });

  describe('formatCount', () => {
    it('formats as whole integer', () => {
      expect(formatCount(142)).toBe('142');
      expect(formatCount(142.7)).toBe('143');
      expect(formatCount(0)).toBe('0');
    });
  });
});
