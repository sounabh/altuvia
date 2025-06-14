/* eslint-disable react/jsx-no-undef */
"use client";

import React, { useState } from 'react';
import SearchBar from './components/SearchBar';
import FilterSection from './components/FilterSection';
import UniversityGrid from './components/UniversityGrid';
import { Filter } from "lucide-react";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGmat, setSelectedGmat] = useState('all');
  const [selectedRanking, setSelectedRanking] = useState('all');

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-white"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h1 className="text-[50px] font-medium">
              Top Global Universities
            </h1>
            <p className="mt-4 text-gray-600">
              Compare and discover the world’s leading universities for your academic journey
            </p>
          </div>

          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 p-6 bg-gradient-to-r from-white/80 via-violet-50/30 to-purple-50/30 backdrop-blur-sm rounded-2xl shadow-lg border border-violet-100/50">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-500 bg-clip-text ">
            <Filter className="h-4 w-4 text-blue-500" />
            Filters
          </div>

          <FilterSection
            selectedGmat={selectedGmat}
            setSelectedGmat={setSelectedGmat}
            selectedRanking={selectedRanking}
            setSelectedRanking={setSelectedRanking}
          />
        </div>

        {/* University Grid */}
        <UniversityGrid
          searchQuery={searchQuery}
          selectedGmat={selectedGmat}
          selectedRanking={selectedRanking}
        />
      </div>
    </div>
  );
};

export default Index;
