import { describe, it, expect } from 'vitest';
import { classifyRisk, riskColor } from '../../utils/riskColors';

describe('classifyRisk', () => {
  describe('low priority (score < 40)', () => {
    it('classifies 0 as low', () => {
      expect(classifyRisk(0)).toBe('low');
    });

    it('classifies 39.9 as low', () => {
      expect(classifyRisk(39.9)).toBe('low');
    });
  });

  describe('medium priority (40 <= score < 60)', () => {
    it('classifies 40 as medium', () => {
      expect(classifyRisk(40)).toBe('medium');
    });

    it('classifies 59.9 as medium', () => {
      expect(classifyRisk(59.9)).toBe('medium');
    });
  });

  describe('high priority (60 <= score < 80)', () => {
    it('classifies 60 as high', () => {
      expect(classifyRisk(60)).toBe('high');
    });

    it('classifies 79.9 as high', () => {
      expect(classifyRisk(79.9)).toBe('high');
    });
  });

  describe('critical priority (score >= 80)', () => {
    it('classifies 80 as critical', () => {
      expect(classifyRisk(80)).toBe('critical');
    });

    it('classifies 100 as critical', () => {
      expect(classifyRisk(100)).toBe('critical');
    });
  });
});

describe('riskColor', () => {
  it('returns green (#22c55e) for score < 40', () => {
    expect(riskColor(0)).toBe('#22c55e');
    expect(riskColor(20)).toBe('#22c55e');
    expect(riskColor(39.9)).toBe('#22c55e');
  });

  it('returns yellow (#eab308) for 40 <= score < 60', () => {
    expect(riskColor(40)).toBe('#eab308');
    expect(riskColor(50)).toBe('#eab308');
    expect(riskColor(59.9)).toBe('#eab308');
  });

  it('returns orange (#f97316) for 60 <= score < 80', () => {
    expect(riskColor(60)).toBe('#f97316');
    expect(riskColor(70)).toBe('#f97316');
    expect(riskColor(79.9)).toBe('#f97316');
  });

  it('returns red (#ef4444) for score >= 80', () => {
    expect(riskColor(80)).toBe('#ef4444');
    expect(riskColor(90)).toBe('#ef4444');
    expect(riskColor(100)).toBe('#ef4444');
  });
});
