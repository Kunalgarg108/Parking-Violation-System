/**
 * SearchBox - Geocoding search input for the Risk Map.
 * Uses Nominatim API to geocode location queries and notifies the parent
 * to pan/zoom the map to the result within 2 seconds.
 * Displays an inline error message if geocoding fails.
 *
 * Validates: Requirements 13.2, 13.6
 */
import { useState, useCallback } from 'react';
import { useDebounce } from '../../hooks/useDebounce';

interface SearchBoxProps {
  /** Callback when geocoding succeeds with lat/lng */
  onLocationFound: (lat: number, lng: number) => void;
  /** Optional callback when geocoding fails */
  onError?: (message: string) => void;
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export default function SearchBox({ onLocationFound, onError }: SearchBoxProps) {
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Debounce query for potential auto-search (currently used on explicit trigger)
  const debouncedQuery = useDebounce(query, 300);

  const handleSearch = useCallback(async () => {
    const searchTerm = debouncedQuery.trim() || query.trim();
    if (!searchTerm) return;

    setError(null);
    setIsSearching(true);

    try {
      const response = await fetch(
        `${NOMINATIM_URL}?format=json&q=${encodeURIComponent(searchTerm)}&limit=1`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }

      const results = await response.json();

      if (!results || results.length === 0) {
        const errorMsg = 'Location could not be found';
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }

      const { lat, lon } = results[0];
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);

      if (isNaN(latitude) || isNaN(longitude)) {
        const errorMsg = 'Location could not be found';
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }

      setError(null);
      onLocationFound(latitude, longitude);
    } catch {
      const errorMsg = 'Location could not be found';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsSearching(false);
    }
  }, [debouncedQuery, query, onLocationFound, onError]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="mb-4">
      <label
        htmlFor="map-search-input"
        className="block text-sm font-semibold text-gray-700 mb-1"
      >
        Search Location
      </label>
      <div className="flex gap-1">
        <input
          id="map-search-input"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Enter address or place..."
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          aria-label="Search location"
          disabled={isSearching}
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
          className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Search"
        >
          {isSearching ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </button>
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
