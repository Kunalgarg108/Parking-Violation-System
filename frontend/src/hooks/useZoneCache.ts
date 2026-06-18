import { useQuery } from '@tanstack/react-query';
import { fetchZoneDetail } from '../services/api';
import type { ZoneDetail } from '../types';

/**
 * Hook to fetch and cache zone details with session-level caching.
 * Uses TanStack Query with staleTime: Infinity so that once a zone is fetched,
 * subsequent requests for the same zone_id are served from cache without a new API call.
 *
 * @param zoneId - The zone ID to fetch details for. Pass null/undefined to disable the query.
 * @returns TanStack Query result with data, isLoading, error, etc.
 */
export function useZoneDetail(zoneId: string | null | undefined) {
  return useQuery<ZoneDetail, Error>({
    queryKey: ['zone', zoneId],
    queryFn: () => fetchZoneDetail(zoneId!),
    enabled: !!zoneId,
    staleTime: Infinity,
  });
}
