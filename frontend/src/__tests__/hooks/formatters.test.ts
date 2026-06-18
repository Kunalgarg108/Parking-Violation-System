import { describe, it, expect } from 'vitest';
import {
  formatPercentage,
  formatRiskScore,
  formatSeverity,
  formatCoordinates,
  formatCount,
} from '../../utils/formatters';

describe('formatPercentage', () => {
  it('formats 73.2456 as "73.2%"', () => {
    expect(formatPercentage(73.2456)).toBe('73.2%');
  });

  it('formats 0 as "0.0%"', () => {
    expect(formatPercentage(0)).toBe('0.0%');
  });

  it('formats 100 as "100.0%"', () => {
    expect(formatPercentage(100)).toBe('100.0%');
  });
});

describe('formatRiskScore', () => {
  it('formats 78.456 as "78.5"', () => {
    expect(formatRiskScore(78.456)).toBe('78.5');
  });

  it('formats 0 as "0.0"', () => {
    expect(formatRiskScore(0)).toBe('0.0');
  });

  it('formats 100 as "100.0"', () => {
    expect(formatRiskScore(100)).toBe('100.0');
  });
});

describe('formatSeverity', () => {
  it('formats 12.3 as "12.30"', () => {
    expect(formatSeverity(12.3)).toBe('12.30');
  });

  it('formats 0 as "0.00"', () => {
    expect(formatSeverity(0)).toBe('0.00');
  });

  it('formats 99.999 as "100.00"', () => {
    expect(formatSeverity(99.999)).toBe('100.00');
  });
});

describe('formatCoordinates', () => {
  it('formats 40.712776 as "40.712776"', () => {
    expect(formatCoordinates(40.712776)).toBe('40.712776');
  });

  it('formats -74.00597400001 as "-74.005974"', () => {
    expect(formatCoordinates(-74.00597400001)).toBe('-74.005974');
  });
});

describe('formatCount', () => {
  it('formats 142 as "142"', () => {
    expect(formatCount(142)).toBe('142');
  });

  it('formats 142.7 as "143"', () => {
    expect(formatCount(142.7)).toBe('143');
  });

  it('formats 0 as "0"', () => {
    expect(formatCount(0)).toBe('0');
  });
});
