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
  // Don't render pagination if only one page
  if (totalPages <= 1) return null;

  // Function to calculate visible page numbers with ellipsis
  const getVisiblePages = () => {
    const delta = 1;
    const range = [];
    const rangeWithDots = [];

    // Calculate range of pages to show around current page
    for (let i = Math.max(2, currentPage - delta); 
         i <= Math.min(totalPages - 1, currentPage + delta); 
         i++) {
      range.push(i);
    }

    // Handle left side ellipsis
    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    // Add middle range
    rangeWithDots.push(...range);

    // Handle right side ellipsis
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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-12 pt-8 border-t border-gray-200">
      
      {/* Results counter */}
      <div className="text-sm text-gray-600 order-2 sm:order-1">
        Showing <span className="font-semibold text-[#002147]">{startItem}</span> to{' '}
        <span className="font-semibold text-[#002147]">{endItem}</span> of{' '}
        <span className="font-semibold text-[#002147]">{totalItems}</span> universities
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2 order-1 sm:order-2">
        
        {/* Previous page button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 bg-white text-[#002147] hover:bg-[#3598FE] hover:text-white hover:border-[#3598FE] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {visiblePages.map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                // Ellipsis for hidden pages
                <div className="flex items-center justify-center w-9 h-9 text-gray-400">
                  <MoreHorizontal className="w-4 h-4" />
                </div>
              ) : (
                // Page number button
                <button
                  onClick={() => onPageChange(page)}
                  className={`flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition-all duration-300 ${
                    currentPage === page
                      ? 'bg-[#002147] text-white hover:bg-[#3598FE]'
                      : 'border border-gray-200 bg-white text-[#002147] hover:bg-[#3598FE] hover:text-white hover:border-[#3598FE]'
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Next page button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 bg-white text-[#002147] hover:bg-[#3598FE] hover:text-white hover:border-[#3598FE] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};


// Main University Grid Component
const UniversityGrid = ({ searchQuery, selectedGmat, selectedRanking }) => {
  // Session and authentication
  const { data: session, status } = useSession();

  // State management
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(6);

  // Refs for abort controller and cache
  const abortControllerRef = useRef(null);
  const cacheRef = useRef(new Map());

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

  // Data fetching function with caching
  const fetchData = useCallback(async (paramsString, forceRefresh = false) => {
    if (!paramsString) return;

    // Cache configuration
    const cached = cacheRef.current.get(paramsString);
    const cacheValidTime = 300000; // 5 minutes

    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && cached && Date.now() - cached.timestamp < cacheValidTime) {
      setUniversities(cached.data.universities);
      setTotalPages(cached.data.totalPages);
      setTotalItems(cached.data.totalItems);
      setLoading(false);
      return;
    }

    // Abort previous request if exists
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

      // Request headers
      const headers = {
        'Cache-Control': 'public, max-age=300',
        'Content-Type': 'application/json',
      };

      // Add authorization if user is logged in
      if (session?.token) {
        headers['Authorization'] = `Bearer ${session?.token}`;
      }

      // API request
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

        // Update state with new data
        setUniversities(responseData.universities);
        setTotalPages(responseData.totalPages);
        setTotalItems(responseData.totalItems);

        // Cache the response
        cacheRef.current.set(paramsString, {
          data: responseData,
          timestamp: Date.now()
        });

        // Limit cache size
        if (cacheRef.current.size > 20) {
          const firstKey = cacheRef.current.keys().next().value;
          cacheRef.current.delete(firstKey);
        }
      } else {
        // Handle empty or invalid response
        setUniversities([]);
        setTotalPages(0);
        setTotalItems(0);
      }

    } catch (error) {
      // Handle errors (ignore abort errors)
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

  // Effect to fetch data when parameters change
  useEffect(() => {
    if (status === "loading") {
      setLoading(true);
      return;
    }

    if (searchParams) {
      // Debounce search queries
      const debounceTime = searchQuery?.trim() ? 300 : 0;
      const handler = setTimeout(() => fetchData(searchParams), debounceTime);
      return () => clearTimeout(handler);
    }
  }, [searchParams, fetchData, status, searchQuery]);

  // Cleanup effect for abort controller
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Manual refresh function
  const handleRefresh = useCallback(() => {
    cacheRef.current.clear();
    if (searchParams) {
      fetchData(searchParams, true);
    }
  }, [searchParams, fetchData]);

  // Page change handler with scroll to top
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    const gridElement = document.getElementById('university-grid');
    if (gridElement) {
      gridElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Loading skeleton component
  const LoadingSkeleton = useMemo(() => (
    <div id="university-grid">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {Array.from({ length: itemsPerPage }, (_, i) => (
          <div 
            key={i} 
            className="bg-white border border-gray-200 overflow-hidden h-80 animate-pulse rounded-lg"
          >
            <div className="bg-gray-200 h-64 w-full" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  ), [itemsPerPage]);

  // Show loading state
  if (loading || status === "loading") return LoadingSkeleton;

  // Show error state
  if (error) {
    return (
      <div className="text-center py-16 bg-white border border-gray-200 shadow-sm rounded-lg" id="university-grid">
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

  // Main render
  return (
    <div id="university-grid">
      
      {/* University cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {universities.length > 0 ? (
          universities.map(university => (
            <UniversityCard 
              key={university.id}
              university={university} 
              onToggleSuccess={(newState) => {
                // Update saved state locally for immediate feedback
                setUniversities(prev => prev.map(u => 
                  u.id === university.id 
                    ? { ...u, savedByUsers: newState ? [{ id: session?.userId || 'current-user' }] : [] }
                    : u
                ));
              }}
            />
          ))
        ) : (
          // Empty state
          <div className="col-span-full text-center py-16 bg-white border border-gray-200 shadow-sm rounded-lg">
            <h3 className="text-xl font-semibold text-[#002147] mb-2">No universities found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Pagination component */}
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