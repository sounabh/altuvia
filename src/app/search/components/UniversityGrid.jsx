"use client";
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import UniversityCard from './UniversityCard';

/**
 * UniversityGrid component
 * 
 * Displays a grid of universities with loading skeleton, error handling, caching,
 * and filtering based on search query, GMAT score, and ranking.
 * 
 * Features:
 * - Uses in-memory cache with expiry for ultra-fast responses.
 * - Aborts stale API calls with AbortController.
 * - Debounced fetch for smoother searching.
 * - Graceful handling of loading, error, and empty states.
 * - Cache invalidation on focus to ensure fresh data after page changes
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.searchQuery - Current search query string
 * @param {string} props.selectedGmat - Selected GMAT filter value
 * @param {string} props.selectedRanking - Selected ranking filter value
 * @returns {JSX.Element} A responsive university grid component
 */
const UniversityGrid = ({ searchQuery, selectedGmat, selectedRanking }) => {
  /** @type {[Array, Function]} Universities state */
  const [universities, setUniversities] = useState([]);

  /** @type {[boolean, Function]} Loading state */
  const [loading, setLoading] = useState(true);

  /** @type {[string|null, Function]} Error message state */
  const [error, setError] = useState(null);

  /** Ref for AbortController to cancel ongoing fetch requests */
  const abortControllerRef = useRef(null);

  /** Ref for in-memory cache (stores fetched data with timestamps) */
  const cacheRef = useRef(new Map());

  /** Track last focus time to invalidate cache when user returns to page */
  const lastFocusRef = useRef(Date.now());

  /**
   * Memoized search parameters to avoid unnecessary re-renders
   * @type {string}
   */
  const searchParams = useMemo(() => {
    const params = {
      search: searchQuery?.trim() || '',
      gmat: selectedGmat || 'all',
      ranking: selectedRanking || 'all'
    };
    return JSON.stringify(params);
  }, [searchQuery, selectedGmat, selectedRanking]);

  /**
   * Clear cache - useful for ensuring fresh data
   * @function
   */
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    console.log('Cache cleared');
  }, []);

  /**
   * Fetch universities data with caching and abort controller
   * 
   * @function
   * @param {string} paramsString - Stringified search parameters
   * @param {boolean} forceRefresh - Force refresh ignoring cache
   * @returns {Promise<void>}
   */
  const fetchData = useCallback(async (paramsString, forceRefresh = false) => {
    // Check cache first (valid for 30 seconds, shorter to ensure fresher data)
    const cached = cacheRef.current.get(paramsString);
    const cacheValidTime = 30000; // 30 seconds
    
    if (!forceRefresh && cached && Date.now() - cached.timestamp < cacheValidTime) {
      setUniversities(cached.data);
      setLoading(false);
      return;
    }

    // Abort any previous ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const params = JSON.parse(paramsString);
      const urlParams = new URLSearchParams(params);

      // Add timestamp to prevent aggressive browser caching
      urlParams.append('t', Date.now().toString());

      const response = await fetch(`/api/universities?${urlParams}`, {
        signal: abortControllerRef.current.signal,
        headers: { 
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) throw new Error(`Error ${response.status}`);

      const result = await response.json();

      if (result.data && Array.isArray(result.data)) {
        setUniversities(result.data);

        // Cache result
        cacheRef.current.set(paramsString, {
          data: result.data,
          timestamp: Date.now()
        });

        // Limit cache size (keep max 10 entries for faster refresh)
        if (cacheRef.current.size > 10) {
          const firstKey = cacheRef.current.keys().next().value;
          cacheRef.current.delete(firstKey);
        }
      } else {
        setUniversities([]);
      }

    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Fetch error:', error);
        setError(error.message);
        setUniversities([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Effect to handle window focus - refresh data when user returns to page
   */
  useEffect(() => {
    const handleFocus = () => {
      const now = Date.now();
      // If user was away for more than 10 seconds, refresh data
      if (now - lastFocusRef.current > 10000) {
        console.log('Page refocused, refreshing data...');
        clearCache();
        fetchData(searchParams, true);
      }
      lastFocusRef.current = now;
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleFocus();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [searchParams, fetchData, clearCache]);

  /**
   * Effect to fetch data with debounce for smoother searching
   */
  useEffect(() => {
    const debounceTime = searchQuery?.trim() ? 300 : 0; // Instant for filters

    const handler = setTimeout(() => {
      fetchData(searchParams);
    }, debounceTime);

    return () => clearTimeout(handler);
  }, [searchParams, fetchData]);

  /**
   * Cleanup effect - aborts any ongoing fetch on unmount
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Skeleton loader for university cards
   */
  const LoadingSkeleton = useMemo(() => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
      {Array.from({ length: 6 }, (_, i) => (
        <div 
          key={i} 
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden h-80 animate-pulse border border-white/60"
        >
          <div className="bg-gradient-to-br from-gray-200/60 to-gray-300/40 h-40 w-full" />
          <div className="p-4 space-y-3">
            <div className="h-5 bg-gray-200/60 rounded-lg w-3/4" />
            <div className="h-3 bg-gray-200/60 rounded-lg w-1/2" />
            <div className="flex gap-4">
              <div className="h-8 bg-gray-200/60 rounded-lg w-16" />
              <div className="h-8 bg-gray-200/60 rounded-lg w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  ), []);

  // Render states: loading, error, results, or empty state
  if (loading) return LoadingSkeleton;

  if (error) {
    return (
      <div className="text-center py-16 relative">
        <div className="absolute inset-0 bg-white/40 backdrop-blur-sm rounded-3xl -m-8"></div>
        <div className="relative z-10">
          <h3 className="text-xl font-medium text-red-600 mb-2 drop-shadow-sm">
            Error loading universities
          </h3>
          <p className="text-gray-600 drop-shadow-sm">{error}</p>
          <button 
            onClick={() => fetchData(searchParams, true)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
      {universities.length > 0 ? (
        universities.map(university => (
          <div key={university.id} className="relative group">
            {/* Individual card backdrop effect */}
            <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 -m-1"></div>
            <div className="relative z-10">
              <UniversityCard university={university} />
            </div>
          </div>
        ))
      ) : (
        <div className="col-span-full text-center py-16 relative">
          <div className="absolute inset-0 bg-white/40 backdrop-blur-sm rounded-3xl -m-8"></div>
          <div className="relative z-10">
            <h3 className="text-xl font-medium text-gray-700 mb-2 drop-shadow-sm">
              No universities found
            </h3>
            <p className="text-gray-600 drop-shadow-sm">
              Try adjusting your search or filter criteria
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UniversityGrid;