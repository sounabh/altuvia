
"use client"
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, SlidersHorizontal, X } from 'lucide-react';




export const SearchFilters = ({
  searchTerm,
  onSearchChange,
  selectedRankFilter,
  onRankFilterChange,
  selectedGmatFilter,
  onGmatFilterChange,
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeFilters, setActiveFilters] = useState(0);

  useEffect(() => {
    let count = 0;
    if (selectedRankFilter && selectedRankFilter !== 'all') count++;
    if (selectedGmatFilter && selectedGmatFilter !== 'all') count++;
    setActiveFilters(count);
  }, [selectedRankFilter, selectedGmatFilter]);



  const clearAllFilters = () => {
    onRankFilterChange('all');
    onGmatFilterChange('all');
    onSearchChange('');
  };

  return (
    <div className="rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border p-6 sm:p-8 mb-8 transition-all duration-500 hover:shadow-[0_16px_50px_rgb(0,0,0,0.15)] bg-[#002147]  backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#3598FE]  rounded-3xl flex items-center justify-center shadow-lg">
            <SlidersHorizontal className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Search Universities
            </h3>
            <p className="text-sm text-white/80 mt-1 font-medium">
              Find institutions that match your criteria
            </p>
          </div>
        </div>

        {(activeFilters > 0 || searchTerm) && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 rounded-2xl transition-all duration-300 backdrop-blur-sm border border-white/20 hover:border-white/30 group"
          >
            <X className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
            Clear {activeFilters > 0 && `(${activeFilters})`}
          </button>
        )}
      </div>

      {/* Search and Filter Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-center sm:gap-6">
        {/* Search Input */}
        <div className="xl:col-span-6 relative w-full max-w-2xl mx-auto">
  <form
    onSubmit={(e) => {
      e.preventDefault();
      // handle search logic here (submitSearch(searchTerm) or similar)
    }}
    className="flex items-center relative"
  >

    <Input
      type="text"
      placeholder="Search by name, location, or program..."
      value={searchTerm}
      onChange={(e) => onSearchChange(e.target.value)}
      onFocus={() => setIsSearchFocused(true)}
      onBlur={() => setIsSearchFocused(false)}
      className="w-full h-12 pl-12 pr-28 py-2 bg-white/90  rounded-full text-sm placeholder:text-[#002147] font-medium "
    />
    <button
      type="submit"
      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#3598FE] text-white px-5 py-2 text-sm font-semibold rounded-full shadow-md hover:shadow-[0_0_10px_#00f0ff] transition-all duration-300"
    >
      Search
    </button>
  </form>
</div>


        {/* Rank Filter */}
        <div className="lg:col-span-2">
          <Select value={selectedRankFilter} onValueChange={onRankFilterChange}>
            <SelectTrigger className="h-14 bg-white backdrop-blur-sm text-gray-900 border-none outline-none focus:ring-2 focus:ring-[#3598FE]/50 shadow-lg hover:bg-white hover:shadow-xl transition-all duration-300 rounded-2xl px-5 text-base font-medium">
              <SelectValue placeholder="University Rank" />
            </SelectTrigger>
            <SelectContent className="bg-white/95 backdrop-blur-sm text-gray-900 border-none shadow-2xl rounded-2xl">
              <SelectItem value="all" className="h-12 text-base font-medium hover:bg-gray-50 rounded-xl">All Rankings</SelectItem>
              <SelectItem value="top100" className="h-12 text-base font-medium hover:bg-gray-50 rounded-xl">Top 100</SelectItem>
              <SelectItem value="top50" className="h-12 text-base font-medium hover:bg-gray-50 rounded-xl">Top 50</SelectItem>
              <SelectItem value="top25" className="h-12 text-base font-medium hover:bg-gray-50 rounded-xl">Top 25</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* GMAT Filter */}
        <div className="lg:col-span-2">
          <Select value={selectedGmatFilter} onValueChange={onGmatFilterChange}>
            <SelectTrigger className="h-14 bg-white/95 backdrop-blur-sm text-gray-900 border-none outline-none focus:ring-2 focus:ring-[#3598FE]/50 shadow-lg hover:bg-white hover:shadow-xl transition-all duration-300 rounded-2xl px-5 text-base font-medium">
              <SelectValue placeholder="GMAT Score Range" />
            </SelectTrigger>
            <SelectContent className="bg-white/95 backdrop-blur-sm text-gray-900 border-none shadow-2xl rounded-2xl">
              <SelectItem value="all" className="h-12 text-base font-medium hover:bg-gray-50 rounded-xl">All Scores</SelectItem>
              <SelectItem value="750+" className="h-12 text-base font-medium hover:bg-gray-50 rounded-xl">750+ (Elite)</SelectItem>
              <SelectItem value="700+" className="h-12 text-base font-medium hover:bg-gray-50 rounded-xl">700+ (Excellent)</SelectItem>
              <SelectItem value="650+" className="h-12 text-base font-medium hover:bg-gray-50 rounded-xl">650+ (Good)</SelectItem>
              <SelectItem value="600+" className="h-12 text-base font-medium hover:bg-gray-50 rounded-xl">600+ (Average)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};