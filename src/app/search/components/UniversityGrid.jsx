"use client";
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import UniversityCard from './UniversityCard';

/**
 * UniversityGrid component - FIXED VERSION
 * 
 * Fixes:
 * - Removed auto-refresh on screen visibility change
 * - Simplified caching logic
 * - Better error handling
 * - Removed unnecessary re-fetches
 */
const UniversityGrid = ({ searchQuery, selectedGmat, selectedRanking }) => {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Abort controller for canceling requests
  const abortControllerRef = useRef(null);
  
  // Simple cache with expiry
  const cacheRef = useRef(new Map());

  /**
   * Memoized search parameters
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
   * Fetch universities data
   */
  const fetchData = useCallback(async (paramsString, forceRefresh = false) => {
    // Check cache first (valid for 5 minutes)
    const cached = cacheRef.current.get(paramsString);
    const cacheValidTime = 300000; // 5 minutes
    
    if (!forceRefresh && cached && Date.now() - cached.timestamp < cacheValidTime) {
      setUniversities(cached.data);
      setLoading(false);
      return;
    }

    // Abort previous request
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

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.data && Array.isArray(result.data)) {
        setUniversities(result.data);

        // Cache result
        cacheRef.current.set(paramsString, {
          data: result.data,
          timestamp: Date.now()
        });

        // Limit cache size
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
   * Effect to fetch data with debounce
   * REMOVED: Visibility change handlers to prevent auto-refresh
   */
  useEffect(() => {
    const debounceTime = searchQuery?.trim() ? 300 : 0;

    const handler = setTimeout(() => {
      fetchData(searchParams);
    }, debounceTime);

    return () => clearTimeout(handler);
  }, [searchParams, fetchData]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Refresh data manually
   */
  const handleRefresh = useCallback(() => {
    cacheRef.current.clear();
    fetchData(searchParams, true);
  }, [searchParams, fetchData]);

  /**
   * Loading skeleton
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

  // Render states
  if (loading) return LoadingSkeleton;

  if (error) {
    return (
      <div className="text-center py-16 relative">
        <div className="absolute inset-0 bg-white/40 backdrop-blur-sm rounded-3xl -m-8"></div>
        <div className="relative z-10">
          <h3 className="text-xl font-medium text-red-600 mb-2 drop-shadow-sm">
            Error loading universities
          </h3>
          <p className="text-gray-600 drop-shadow-sm mb-4">{error}</p>
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
            <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 -m-1"></div>
            <div className="relative z-10">
              <UniversityCard 
                university={university} 
                onToggleSuccess={(newState) => {
                  // Update the university in local state
                  setUniversities(prev => prev.map(u => 
                    u.id === university.id 
                      ? { ...u, savedByUsers: newState ? [{ id: 'current-user' }] : [] }
                      : u
                  ));
                }}
              />
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