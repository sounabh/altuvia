"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-200">
      
      {/* Results counter */}
      <div className="text-sm text-gray-600 order-2 sm:order-1">
        Showing <span className="font-semibold text-[#002147]">{startItem}</span> to{' '}
        <span className="font-semibold text-[#002147]">{endItem}</span> of{' '}
        <span className="font-semibold text-[#002147]">{totalItems}</span> universities
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2 order-1 sm:order-2">
        
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white text-[#002147] hover:bg-[#3598FE] hover:text-white hover:border-[#3598FE] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          {visiblePages.map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <div className="flex items-center justify-center w-10 h-10 text-gray-400">
                  <MoreHorizontal className="w-5 h-5" />
                </div>
              ) : (
                <button
                  onClick={() => onPageChange(page)}
                  className={`flex items-center justify-center min-w-[40px] h-10 px-3 rounded-lg text-sm font-medium transition-all duration-300 ${
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

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white text-[#002147] hover:bg-[#3598FE] hover:text-white hover:border-[#3598FE] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// Main University Grid Component
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedGmat, selectedRanking]);

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

  const fetchData = useCallback(async (paramsString, forceRefresh = false) => {
    if (!paramsString) return;

    const cached = cacheRef.current.get(paramsString);
    const cacheValidTime = 300000;

    if (!forceRefresh && cached && Date.now() - cached.timestamp < cacheValidTime) {
      setUniversities(cached.data.universities);
      setTotalPages(cached.data.totalPages);
      setTotalItems(cached.data.totalItems);
      setLoading(false);
      return;
    }

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
        'Cache-Control': 'public, max-age=300',
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

        cacheRef.current.set(paramsString, {
          data: responseData,
          timestamp: Date.now()
        });

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

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleRefresh = useCallback(() => {
    cacheRef.current.clear();
    if (searchParams) {
      fetchData(searchParams, true);
    }
  }, [searchParams, fetchData]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Loading Skeleton
  const LoadingSkeleton = useMemo(() => (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
        {Array.from({ length: itemsPerPage }, (_, i) => (
          <div 
            key={i} 
            className="bg-white border border-gray-200 overflow-hidden animate-pulse rounded-lg flex flex-col"
            style={{ minHeight: '540px', maxHeight: '540px' }}
          >
            <div className="bg-gray-200 h-56 w-full flex-shrink-0" />
            <div className="p-4 space-y-3 flex-1 flex flex-col">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="flex-1" />
              <div className="h-10 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  ), [itemsPerPage]);

  if (loading || status === "loading") return LoadingSkeleton;

  if (error) {
    return (
      <div className="w-full text-center py-16 bg-white border border-gray-200 shadow-sm rounded-lg">
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
    <div className="w-full">
      
      {/* University Grid - Properly aligned 3 columns with equal heights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
        {universities.length > 0 ? (
          universities.map(university => (
            <UniversityCard 
              key={university.id}
              university={university} 
              onToggleSuccess={(newState) => {
                setUniversities(prev => prev.map(u => 
                  u.id === university.id 
                    ? { ...u, savedByUsers: newState ? [{ id: session?.userId || 'current-user' }] : [] }
                    : u
                ));
              }}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-16 bg-white border border-gray-200 shadow-sm rounded-lg">
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