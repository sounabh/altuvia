"use client";

// React and hooks imports
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';

// Component and icon imports
import UniversityCard from './UniversityCard';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';


// Pagination Component
const Pagination = ({ 
  currentPage, 
  totalPages, 
  totalItems, 
  itemsPerPage, 
  onPageChange 
}) => {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const delta = 1;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); 
         i <= Math.min(totalPages - 1, currentPage + delta); 
         i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-12 pt-6 border-t border-gray-200/50">
      <div className="text-sm text-gray-500 font-medium order-2 sm:order-1">
        Showing <span className="text-[#002147] font-bold">{startItem}</span> - <span className="text-[#002147] font-bold">{endItem}</span> of <span className="text-[#002147] font-bold">{totalItems}</span>
      </div>

      <div className="flex items-center gap-2 order-1 sm:order-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-[#3598FE] disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-600 transition-all duration-200 shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5 px-2">
          {visiblePages.map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <div className="flex items-center justify-center w-8 h-8 text-gray-300">
                  <MoreHorizontal className="w-4 h-4" />
                </div>
              ) : (
                <button
                  onClick={() => onPageChange(page)}
                  className={`flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold transition-all duration-200 ${
                    currentPage === page
                      ? 'bg-[#002147] text-white shadow-md scale-105'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-[#3598FE] shadow-sm'
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-[#3598FE] disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-600 transition-all duration-200 shadow-sm"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};


const UniversityGrid = ({ searchQuery, selectedGmat, selectedRanking }) => {
  const { data: session, status } = useSession();

  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(6);

  const abortControllerRef = useRef(null);
  const cacheRef = useRef(new Map());
  const lastFetchTimeRef = useRef(0);
  const isVisibleRef = useRef(true);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedGmat, selectedRanking]);

  // Memoized search parameters for API call
  const searchParams = useMemo(() => {
    if (status === "loading") return null;

    return JSON.stringify({
      search: searchQuery?.trim() || '',
      gmat: selectedGmat || 'all',
      ranking: selectedRanking || 'all',
      email: session?.user?.email || '',
      userId: session?.userId || '',
      page: currentPage,
      limit: itemsPerPage
    });
  }, [searchQuery, selectedGmat, selectedRanking, session, status, currentPage, itemsPerPage]);

  // Data fetching function
  const fetchData = useCallback(async (paramsString, forceRefresh = false) => {
    if (!paramsString) return;

    const now = Date.now();
    const cached = cacheRef.current.get(paramsString);
    // Reduced cache time to 30 seconds for faster updates
    const cacheValidTime = 30000;

    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && cached && now - cached.timestamp < cacheValidTime) {
      setUniversities(cached.data.universities);
      setTotalPages(cached.data.totalPages);
      setTotalItems(cached.data.totalItems);
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
      const urlParams = new URLSearchParams({
        search: params.search,
        gmat: params.gmat,
        ranking: params.ranking,
        page: params.page.toString(),
        limit: params.limit.toString(),
        ...(params.email && { email: params.email }),
        ...(params.userId && { userId: params.userId })
      });

      const headers = {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
      };

      if (session?.token) {
        headers['Authorization'] = `Bearer ${session?.token}`;
      }

      const response = await fetch(`/api/universities?${urlParams}`, {
        signal: abortControllerRef.current.signal,
        headers
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

      const result = await response.json();

      if (result.data && Array.isArray(result.data)) {
        const responseData = {
          universities: result.data,
          totalPages: result.pagination?.totalPages || Math.ceil(result.total / itemsPerPage) || 1,
          totalItems: result.pagination?.totalItems || result.total || result.data.length
        };

        setUniversities(responseData.universities);
        setTotalPages(responseData.totalPages);
        setTotalItems(responseData.totalItems);
        lastFetchTimeRef.current = now;

        // Update cache
        cacheRef.current.set(paramsString, {
          data: responseData,
          timestamp: now
        });

        // Limit cache size
        if (cacheRef.current.size > 20) {
          const firstKey = cacheRef.current.keys().next().value;
          cacheRef.current.delete(firstKey);
        }
      } else {
        setUniversities([]);
        setTotalPages(0);
        setTotalItems(0);
      }

    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Fetch error:', error);
        setError(error.message);
        setUniversities([]);
        setTotalPages(0);
        setTotalItems(0);
      }
    } finally {
      setLoading(false);
    }
  }, [session, itemsPerPage]);

  // ✅ NEW: Handle visibility change - refresh when user returns to tab/page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isVisibleRef.current) {
        // User returned to the page - clear cache and refetch
        console.log('Page became visible - refreshing data');
        cacheRef.current.clear();
        if (searchParams) {
          fetchData(searchParams, true);
        }
      }
      isVisibleRef.current = document.visibilityState === 'visible';
    };

    const handleFocus = () => {
      // Also refresh on window focus (catches more cases)
      const timeSinceLastFetch = Date.now() - lastFetchTimeRef.current;
      // If more than 2 seconds since last fetch, refresh
      if (timeSinceLastFetch > 2000 && searchParams) {
        console.log('Window focused - refreshing data');
        cacheRef.current.clear();
        fetchData(searchParams, true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [searchParams, fetchData]);

  // Effect to fetch data when parameters change
  useEffect(() => {
    if (status === "loading") {
      setLoading(true);
      return;
    }

    if (searchParams) {
      const debounceTime = searchQuery?.trim() ? 300 : 0;
      const handler = setTimeout(() => fetchData(searchParams), debounceTime);
      return () => clearTimeout(handler);
    }
  }, [searchParams, fetchData, status, searchQuery]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // ✅ NEW: Update local state when toggle happens
  const handleToggleSuccess = useCallback((universityId, newState) => {
    setUniversities(prev => prev.map(u => 
      u.id === universityId 
        ? { ...u, isAdded: newState }
        : u
    ));
    
    // Also update cache
    cacheRef.current.forEach((value, key) => {
      const updatedUniversities = value.data.universities.map(u =>
        u.id === universityId ? { ...u, isAdded: newState } : u
      );
      cacheRef.current.set(key, {
        ...value,
        data: { ...value.data, universities: updatedUniversities }
      });
    });
  }, []);

  // Manual refresh function
  const handleRefresh = useCallback(() => {
    cacheRef.current.clear();
    if (searchParams) {
      fetchData(searchParams, true);
    }
  }, [searchParams, fetchData]);

  // Page change handler
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    const gridElement = document.getElementById('university-grid');
    if (gridElement) {
      gridElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Loading skeleton
  const LoadingSkeleton = useMemo(() => (
    <div id="university-grid">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {Array.from({ length: itemsPerPage }, (_, i) => (
          <div key={i} className="flex flex-col gap-4 h-full animate-pulse">
            <div className="bg-gray-200 h-60 w-full rounded-2xl" />
            <div className="flex-grow bg-white rounded-2xl p-5 border border-gray-100 space-y-4">
              <div className="h-6 bg-gray-200 rounded w-3/4" />
              <div className="grid grid-cols-3 gap-2">
                <div className="h-10 bg-gray-200 rounded-xl" />
                <div className="h-10 bg-gray-200 rounded-xl" />
                <div className="h-10 bg-gray-200 rounded-xl" />
              </div>
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-10 bg-gray-200 rounded-lg mt-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  ), [itemsPerPage]);

  if (loading || status === "loading") return LoadingSkeleton;

  if (error) {
    return (
      <div className="text-center py-16 bg-white shadow-sm rounded-lg" id="university-grid">
        <h3 className="text-xl font-semibold text-[#3598FE] mb-2">Error loading universities</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={handleRefresh}
          className="px-6 py-3 bg-[#002147] text-white rounded-lg hover:bg-[#3598FE] transition-all duration-700 ease-in-out transform hover:rounded-3xl font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div id="university-grid">
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-10 space-y-10 mb-8">
        {universities.length > 0 ? (
          universities.map((university, index) => (
            <div key={university.id} className="break-inside-avoid">
              <UniversityCard 
                university={university} 
                index={index}
                onToggleSuccess={handleToggleSuccess}
              />
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-16 bg-white shadow-sm rounded-lg break-inside-avoid">
            <h3 className="text-xl font-semibold text-[#002147] mb-2">No universities found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default UniversityGrid;