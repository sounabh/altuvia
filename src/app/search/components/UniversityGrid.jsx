"use client";
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import UniversityCard from './UniversityCard';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

/**
 * Modern Pagination Component
 */
const Pagination = ({ 
  currentPage, 
  totalPages, 
  totalItems, 
  itemsPerPage, 
  onPageChange 
}) => {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const delta = 1; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];

    // Calculate range of pages to show
    for (let i = Math.max(2, currentPage - delta); 
         i <= Math.min(totalPages - 1, currentPage + delta); 
         i++) {
      range.push(i);
    }

    // Add first page
    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    // Add middle pages
    rangeWithDots.push(...range);

    // Add last page
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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-16 px-4">
      {/* Results info */}
      <div className="text-sm text-gray-600 order-2 sm:order-1">
        Showing <span className="font-medium text-gray-900">{startItem}</span> to{' '}
        <span className="font-medium text-gray-900">{endItem}</span> of{' '}
        <span className="font-medium text-gray-900">{totalItems}</span> universities
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2 order-1 sm:order-2">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {visiblePages.map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <div className="flex items-center justify-center w-9 h-9 text-gray-400">
                  <MoreHorizontal className="w-4 h-4" />
                </div>
              ) : (
                <button
                  onClick={() => onPageChange(page)}
                  className={`flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/**
 * UniversityGrid Component with Pagination
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

  /** User email from localStorage */
  const [userEmail, setUserEmail] = useState(null);

  /** Current page number */
  const [currentPage, setCurrentPage] = useState(1);

  /** Total number of pages */
  const [totalPages, setTotalPages] = useState(0);

  /** Total number of items */
  const [totalItems, setTotalItems] = useState(0);

  /** Items per page */
  const [itemsPerPage] = useState(6);

  /** Reference to AbortController to cancel ongoing requests */
  const abortControllerRef = useRef(null);

  /** Simple in-memory cache for API responses */
  const cacheRef = useRef(new Map());

  // ----------------------------
  // Get User Email from localStorage
  // ----------------------------

  useEffect(() => {
    try {
      const authData = localStorage.getItem("authData");
      if (authData) {
        const parsedAuth = JSON.parse(authData);
        setUserEmail(parsedAuth.email);
      }
    } catch (error) {
      console.error('Error parsing auth data:', error);
    }
  }, []);

  // ----------------------------
  // Reset page when filters change
  // ----------------------------

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedGmat, selectedRanking]);

  // ----------------------------
  // Derived Values
  // ----------------------------

  const searchParams = useMemo(() => {
    return JSON.stringify({
      search: searchQuery?.trim() || '',
      gmat: selectedGmat || 'all',
      ranking: selectedRanking || 'all',
      email: userEmail || '',
      page: currentPage,
      limit: itemsPerPage
    });
  }, [searchQuery, selectedGmat, selectedRanking, userEmail, currentPage, itemsPerPage]);

  // ----------------------------
  // Data Fetching Logic
  // ----------------------------

  const fetchData = useCallback(async (paramsString, forceRefresh = false) => {
    const cached = cacheRef.current.get(paramsString);
    const cacheValidTime = 300000; // 5 minutes

    // Serve from cache if still valid
    if (!forceRefresh && cached && Date.now() - cached.timestamp < cacheValidTime) {
      setUniversities(cached.data.universities);
      setTotalPages(cached.data.totalPages);
      setTotalItems(cached.data.totalItems);
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
      const urlParams = new URLSearchParams({
        search: params.search,
        gmat: params.gmat,
        ranking: params.ranking,
        page: params.page.toString(),
        limit: params.limit.toString(),
        ...(params.email && { email: params.email })
      });

      const response = await fetch(`/api/universities?${urlParams}`, {
        signal: abortControllerRef.current.signal,
        headers: { 
          'Cache-Control': 'public, max-age=300',
        }
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

      const result = await response.json();
      console.log('API Response:', result); // Debug log

      if (result.data && Array.isArray(result.data)) {
        const responseData = {
          universities: result.data,
          totalPages: result.pagination?.totalPages || Math.ceil(result.total / itemsPerPage) || 1,
          totalItems: result.pagination?.totalItems || result.total || result.data.length
        };

        setUniversities(responseData.universities);
        setTotalPages(responseData.totalPages);
        setTotalItems(responseData.totalItems);

        // Cache result
        cacheRef.current.set(paramsString, {
          data: responseData,
          timestamp: Date.now()
        });

        // Limit cache size to 20 entries (more for pagination)
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
  }, []);

  // ----------------------------
  // Effects
  // ----------------------------

  useEffect(() => {
    if (userEmail !== null || userEmail === null) {
      const debounceTime = searchQuery?.trim() ? 300 : 0;
      const handler = setTimeout(() => fetchData(searchParams), debounceTime);
      return () => clearTimeout(handler);
    }
  }, [searchParams, fetchData, userEmail]);

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

  const handleRefresh = useCallback(() => {
    cacheRef.current.clear();
    fetchData(searchParams, true);
  }, [searchParams, fetchData]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    // Smooth scroll to top of results
    const gridElement = document.getElementById('university-grid');
    if (gridElement) {
      gridElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // ----------------------------
  // UI: Loading Skeleton
  // ----------------------------

  const LoadingSkeleton = useMemo(() => (
    <div id="university-grid">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {Array.from({ length: itemsPerPage }, (_, i) => (
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
      {/* Loading pagination skeleton */}
      <div className="flex items-center justify-between mt-8 px-4">
        <div className="h-5 bg-gray-200/60 rounded w-48 animate-pulse" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="w-9 h-9 bg-gray-200/60 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  ), [itemsPerPage]);

  // ----------------------------
  // Render
  // ----------------------------

  if (loading) return LoadingSkeleton;

  if (error) {
    return (
      <div className="text-center py-16 relative" id="university-grid">
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
    <div id="university-grid">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mb-8">
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

      {/* Pagination */}
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