"use client";

import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

/**
 * SearchFilters Component
 *
 * Provides a UI for searching and filtering universities by:
 * - Search term (name, location, or program)
 * - Ranking filter
 * - GMAT score filter
 *
 * Displays the number of active filters, allows clearing all filters,
 * and passes changes back up through callback props.
 *
 * @component
 *
 * @param {Object} props - Component props
 * @param {string} props.searchTerm - Current search query input
 * @param {function} props.onSearchChange - Callback when the search input changes
 * @param {string} props.selectedRankFilter - Currently selected ranking filter
 * @param {function} props.onRankFilterChange - Callback when ranking filter changes
 * @param {string} props.selectedGmatFilter - Currently selected GMAT score filter
 * @param {function} props.onGmatFilterChange - Callback when GMAT filter changes
 */
const SearchFilters = ({
  searchTerm,
  onSearchChange,
  selectedRankFilter,
  onRankFilterChange,
  selectedGmatFilter,
  onGmatFilterChange,
}) => {
  /**
   * Tracks the number of currently active filters.
   * @type {number}
   */
  const [activeFilters, setActiveFilters] = useState(0);

  /**
   * Effect hook to count active filters whenever ranking or GMAT filter changes.
   */
  useEffect(() => {
    let count = 0;

    if (selectedRankFilter && selectedRankFilter !== 'all') count++;
    if (selectedGmatFilter && selectedGmatFilter !== 'all') count++;

    setActiveFilters(count);
  }, [selectedRankFilter, selectedGmatFilter]);

  /**
   * Clears all filters (search, ranking, GMAT) back to default values.
   */
  const clearAllFilters = () => {
    onRankFilterChange('all');
    onGmatFilterChange('all');
    onSearchChange('');
  };

  return (
    <div className="rounded-xl shadow-lg border border-gray-200/60 p-6 mb-8 transition-all duration-300 hover:shadow-xl bg-white/95 backdrop-blur-sm">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-md">
            <SlidersHorizontal className="h-5 w-5 text-white" />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900">Search Universities</h3>
            <p className="text-sm text-gray-600 mt-1">
              Find institutions that match your criteria
            </p>
          </div>
        </div>

        {/* Clear All Filters Button */}
        {(activeFilters > 0 || searchTerm) && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-300"
          >
            <X className="h-4 w-4" />
            Clear {activeFilters > 0 && `(${activeFilters})`}
          </button>
        )}
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">

        {/* Search Input */}
        <div className="md:col-span-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, location, or program..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full h-12 pl-4 pr-12 py-2 bg-white border border-gray-200/60 rounded-xl text-sm placeholder:text-gray-400 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />

            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {/* NOTE: Ensure `Search` icon is imported */}
              <Search className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Ranking Filter Dropdown */}
        <div className="md:col-span-3">
          <select
            value={selectedRankFilter}
            onChange={(e) => onRankFilterChange(e.target.value)}
            className="w-full h-12 bg-white border border-gray-200/60 rounded-xl px-4 text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          >
            <option value="all">All Rankings</option>
            <option value="top100">Top 100</option>
            <option value="top50">Top 50</option>
            <option value="top25">Top 25</option>
          </select>
        </div>

        {/* GMAT Filter Dropdown */}
        <div className="md:col-span-3">
          <select
            value={selectedGmatFilter}
            onChange={(e) => onGmatFilterChange(e.target.value)}
            className="w-full h-12 bg-white border border-gray-200/60 rounded-xl px-4 text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          >
            <option value="all">All Scores</option>
            <option value="750+">750+ (Elite)</option>
            <option value="700+">700+ (Excellent)</option>
            <option value="650+">650+ (Good)</option>
            <option value="600+">600+ (Average)</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default SearchFilters;
