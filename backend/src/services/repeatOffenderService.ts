import { dataCache } from './csvLoader';
import type { RepeatOffender } from '../types/index';

export function getRepeatOffenders(params: {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): { offenders: RepeatOffender[]; total: number; page: number; pageSize: number } {
  const { search, page = 1, pageSize = 20, sortOrder = 'desc' } = params;

  let filtered = Array.from(dataCache.repeatOffenders.values());

  // Search by vehicle number
  if (search && search.trim()) {
    const term = search.trim().toUpperCase();
    filtered = filtered.filter((o) => o.vehicleNumber.toUpperCase().includes(term));
  }

  // Sort by violation count
  filtered.sort((a, b) =>
    sortOrder === 'desc' ? b.violationCount - a.violationCount : a.violationCount - b.violationCount
  );

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const offenders = filtered.slice(start, start + pageSize);

  return { offenders, total, page, pageSize };
}
