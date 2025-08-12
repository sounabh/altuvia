"use client";

import React, { useState, useEffect } from 'react';
import UniversityCard from './UniversityCard';

/**
 * University grid component that displays filtered universities based on search and filter criteria
 * @param {Object} props - Component props
 * @param {string} props.searchQuery - Search query string for filtering by name/location
 * @param {string} props.selectedGmat - Selected GMAT score range filter
 * @param {string} props.selectedRanking - Selected university ranking filter
 * @returns {JSX.Element} Responsive grid of university cards with loading and error states
 */
const UniversityGrid = ({ searchQuery, selectedGmat, selectedRanking }) => {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Effect hook to fetch universities based on current filters
   * Implements debouncing to prevent excessive API calls
   * 
   * 
   */

 
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Construct query parameters from current filters
        const params = new URLSearchParams({
          search: searchQuery,
          gmat: selectedGmat,
          ranking: selectedRanking
        });

        const response = await fetch(`/api/universities?${params}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        console.log('API Response:', result);
        
        // Handle API response data
        if (result.data && Array.isArray(result.data)) {
          setUniversities(result.data);
        } else if (result.error) {
          setError(result.error);
          setUniversities([]);
        } else {
          // Fallback for unexpected response structure
          setUniversities([]);
        }
        
      } catch (error) {
        console.error("Fetch error:", error);
        setError(error.message);
        setUniversities([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce API calls to prevent excessive requests
    const handler = setTimeout(fetchData, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, selectedGmat, selectedRanking]);

  /**
   * Loading state skeleton UI
   */
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden h-96 animate-pulse">
            <div className="bg-gray-200 h-48 w-full" />
            <div className="p-5 space-y-4">
              <div className="h-6 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  /**
   * Error state UI
   */
  if (error) {
    return (
      <div className="col-span-full text-center py-16">
        <h3 className="text-xl font-medium text-red-600 mb-2">
          Error loading universities
        </h3>
        <p className="text-gray-500">
          {error}
        </p>
      </div>
    );
  }

  /**
   * Main grid rendering
   */
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
      {universities && universities.length > 0 ? (
        universities.map(university => (
          <UniversityCard key={university.id} university={university} />
        ))
      ) : (
        <div className="col-span-full text-center py-16">
          <h3 className="text-xl font-medium text-gray-700 mb-2">
            No universities found
          </h3>
          <p className="text-gray-500">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
};

export default UniversityGrid;