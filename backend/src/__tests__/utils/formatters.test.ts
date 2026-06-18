import { describe, it, expect } from 'vitest';
import { roundTo, formatPercentage, formatRiskScore, formatSeverity } from '../../utils/formatters';

describe('backend/utils/formatters', () => {
  describe('roundTo', () => {
    it('rounds to 0 decimal places', () => {
      expect(roundTo(3.7, 0)).toBe(4);
      expect(roundTo(3.4, 0)).toBe(3);
    });

    it('rounds to 1 decimal place', () => {
      expect(roundTo(3.75, 1)).toBe(3.8);
      expect(roundTo(3.74, 1)).toBe(3.7);
    });

    it('rounds to 2 decimal places', () => {
      expect(roundTo(3.456, 2)).toBe(3.46);
      expect(roundTo(3.454, 2)).toBe(3.45);
    });

    it('handles whole numbers', () => {
      expect(roundTo(5, 2)).toBe(5);
    });
  });

  describe('formatPercentage', () => {
    it('formats with 1 decimal and % suffix', () => {
      expect(formatPercentage(73.2456)).toBe('73.2%');
      expect(formatPercentage(0)).toBe('0%');
      expect(formatPercentage(100)).toBe('100%');
    });
  });

  describe('formatRiskScore', () => {
    it('formats with 1 decimal place', () => {
      expect(formatRiskScore(78.456)).toBe('78.5');
      expect(formatRiskScore(0)).toBe('0.0');
      expect(formatRiskScore(100)).toBe('100.0');
    });
  });

  describe('formatSeverity', () => {
    it('formats with 2 decimal places', () => {
      expect(formatSeverity(12.3)).toBe('12.30');
      expect(formatSeverity(12.345)).toBe('12.35');
      expect(formatSeverity(0)).toBe('0.00');
    });
  });
});
