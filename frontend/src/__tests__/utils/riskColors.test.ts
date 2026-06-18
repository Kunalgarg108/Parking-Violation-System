import { describe, it, expect } from 'vitest';
import { classifyRisk, riskColor } from '../../utils/riskColors';

describe('frontend/utils/riskColors', () => {
  describe('classifyRisk', () => {
    it('returns "low" for scores below 40', () => {
      expect(classifyRisk(0)).toBe('low');
      expect(classifyRisk(20)).toBe('low');
      expect(classifyRisk(39.9)).toBe('low');
    });

    it('returns "medium" for scores from 40 to below 60', () => {
      expect(classifyRisk(40)).toBe('medium');
      expect(classifyRisk(50)).toBe('medium');
      expect(classifyRisk(59.9)).toBe('medium');
    });

    it('returns "high" for scores from 60 to below 80', () => {
      expect(classifyRisk(60)).toBe('high');
      expect(classifyRisk(70)).toBe('high');
      expect(classifyRisk(79.9)).toBe('high');
    });

    it('returns "critical" for scores 80 and above', () => {
      expect(classifyRisk(80)).toBe('critical');
      expect(classifyRisk(90)).toBe('critical');
      expect(classifyRisk(100)).toBe('critical');
    });
  });

  describe('riskColor', () => {
    it('returns green for low scores', () => {
      expect(riskColor(0)).toBe('#22c55e');
      expect(riskColor(39)).toBe('#22c55e');
    });

    it('returns yellow for medium scores', () => {
      expect(riskColor(40)).toBe('#eab308');
      expect(riskColor(59)).toBe('#eab308');
    });

    it('returns orange for high scores', () => {
      expect(riskColor(60)).toBe('#f97316');
      expect(riskColor(79)).toBe('#f97316');
    });

    it('returns red for critical scores', () => {
      expect(riskColor(80)).toBe('#ef4444');
      expect(riskColor(100)).toBe('#ef4444');
    });
  });
});
