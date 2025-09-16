"use client";
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import UniversityCard from './UniversityCard';

/**
 * UniversityGrid Component
 * 
 * Renders a responsive grid of university cards based on search and filter criteria.
 * Handles data fetching with caching, debouncing, aborting requests, and error states.
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.searchQuery - Current search query entered by the user
 * @param {string} props.selectedGmat - Selected GMAT filter value
 * @param {string} props.selectedRanking - Selected ranking filter value
 * @returns {JSX.Element} University grid UI
 */
const UniversityGrid = ({ searchQuery, selectedGmat, selectedRanking }) => {
  // ----------------------------
  // State Management
  // ----------------------------

  /** Universities data returned from API */
  const [universities, setUniversities] = useState([]);

  /** Loading state for API request */
  const [loading, setLoading] = useState(true);

  /** Error state if API fails */
  const [error, setError] = useState(null);

  /** Reference to AbortController to cancel ongoing requests */
  const abortControllerRef = useRef(null);

  /** Simple in-memory cache for API responses */
  const cacheRef = useRef(new Map());

  // ----------------------------
  // Derived Values
  // ----------------------------

  /**
   * Memoized search params (serialized string) for caching and request uniqueness
   */
  const searchParams = useMemo(() => {
    return JSON.stringify({
      search: searchQuery?.trim() || '',
      gmat: selectedGmat || 'all',
      ranking: selectedRanking || 'all'
    });
  }, [searchQuery, selectedGmat, selectedRanking]);

  // ----------------------------
  // Data Fetching Logic
  // ----------------------------

  /**
   * Fetch universities from API with caching and request aborting
   * 
   * @param {string} paramsString - Serialized search parameters
   * @param {boolean} [forceRefresh=false] - Whether to bypass cache
   */
  const fetchData = useCallback(async (paramsString, forceRefresh = false) => {
    const cached = cacheRef.current.get(paramsString);
    const cacheValidTime = 300000; // 5 minutes

    // Serve from cache if still valid
    if (!forceRefresh && cached && Date.now() - cached.timestamp < cacheValidTime) {
      setUniversities(cached.data);
      setLoading(false);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const params = JSON.parse(paramsString);
      const urlParams = new URLSearchParams(params);

      const response = await fetch(`/api/universities?${urlParams}`, {
        signal: abortControllerRef.current.signal,
        headers: { 
          'Cache-Control': 'public, max-age=300',
        }
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

      const result = await response.json();

      if (result.data && Array.isArray(result.data)) {
        setUniversities(result.data);

        // Cache result
        cacheRef.current.set(paramsString, {
          data: result.data,
          timestamp: Date.now()
        });

        // Limit cache size to 10 entries
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

  // ----------------------------
  // Effects
  // ----------------------------

  /**
   * Fetch universities when search params change
   * Includes debounce for search input
   */
  useEffect(() => {
    const debounceTime = searchQuery?.trim() ? 300 : 0;
    const handler = setTimeout(() => fetchData(searchParams), debounceTime);
    return () => clearTimeout(handler);
  }, [searchParams, fetchData]);

  /**
   * Cleanup: abort any ongoing requests on unmount
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // ----------------------------
  // Handlers
  // ----------------------------

  /**
   * Clear cache and refresh data from API
   */
  const handleRefresh = useCallback(() => {
    cacheRef.current.clear();
    fetchData(searchParams, true);
  }, [searchParams, fetchData]);

  // ----------------------------
  // UI: Loading Skeleton
  // ----------------------------

  /**
   * Skeleton loader displayed while universities are being fetched
   */
  const LoadingSkeleton = useMemo(() => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
      {Array.from({ length: 6 }, (_, i) => (
        <div 
          key={i} 
          className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden h-80 animate-pulse border border-gray-200/60"
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

  // ----------------------------
  // Render
  // ----------------------------

  if (loading) return LoadingSkeleton;

  if (error) {
    return (
      <div className="text-center py-16 relative">
        <div className="absolute inset-0 bg-white/40 backdrop-blur-sm rounded-xl -m-8"></div>
        <div className="relative z-10">
          <h3 className="text-xl font-medium text-red-600 mb-2">Error loading universities</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={handleRefresh}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
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
            <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 -m-1"></div>
            <UniversityCard 
              university={university} 
              onToggleSuccess={(newState) => {
                setUniversities(prev => prev.map(u => 
                  u.id === university.id 
                    ? { ...u, savedByUsers: newState ? [{ id: 'current-user' }] : [] }
                    : u
                ));
              }}
            />
          </div>
        ))
      ) : (
        <div className="col-span-full text-center py-16 relative">
          <div className="absolute inset-0 bg-white/40 backdrop-blur-sm rounded-xl -m-8"></div>
          <div className="relative z-10">
            <h3 className="text-xl font-medium text-gray-700 mb-2">No universities found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UniversityGrid;
