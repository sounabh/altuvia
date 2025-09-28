"use client"

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, GraduationCap, Users, BookOpen, 
  Clock, DollarSign, ChevronRight, Search,
  Filter, Grid, List, MapPin, Award, Star,
  Building2, Calendar, TrendingUp, FileText
} from 'lucide-react';

/**
 * Custom hook for debounced search
 * @param {string} value - The search value to debounce
 * @param {number} delay - Delay in milliseconds (default: 300)
 * @returns {string} Debounced value
 */
const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Intelligently format duration based on the numeric value
 * Numbers 1-6 are treated as years, 7+ are treated as months
 * @param {number} duration - Duration value from the database
 * @returns {string} Formatted duration string
 */
const formatDuration = (duration) => {
  if (!duration) return 'Not specified';
  
  // Convert to number if it's a string
  const numDuration = typeof duration === 'string' ? parseInt(duration) : duration;
  
  if (isNaN(numDuration)) return 'Not specified';
  
  // Logic: 1-6 are years, 7+ are months
  if (numDuration <= 6) {
    return numDuration === 1 ? '1 year' : `${numDuration} years`;
  } else {
    // If it's a multiple of 12 and greater than 12, convert to years for readability
    if (numDuration >= 12 && numDuration % 12 === 0) {
      const years = numDuration / 12;
      return years === 1 ? '1 year' : `${years} years`;
    }
    // Otherwise, show as months
    return numDuration === 1 ? '1 month' : `${numDuration} months`;
  }
};

/**
 * Skeleton component for individual program cards
 */
const ProgramCardSkeleton = ({ viewMode }) => (
  <Card className={`animate-pulse border-0 bg-white ${viewMode === 'grid' ? '' : ''}`}>
    <CardContent className="p-6">
      <div className={`${viewMode === 'list' ? 'flex items-start justify-between' : ''}`}>
        <div className={`${viewMode === 'list' ? 'flex-1 pr-6' : ''}`}>
          {/* Header skeleton */}
          <div className="flex items-start mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-lg mr-4 flex-shrink-0"></div>
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded mb-2 w-3/4"></div>
              <div className="flex flex-wrap gap-2 mt-1">
                <div className="h-4 bg-gray-100 rounded-full w-16"></div>
                <div className="h-4 bg-gray-100 rounded-full w-20"></div>
              </div>
            </div>
          </div>

          {/* Description skeleton */}
          <div className="space-y-2 mb-4">
            <div className="h-3 bg-gray-100 rounded w-full"></div>
            <div className="h-3 bg-gray-100 rounded w-5/6"></div>
            <div className="h-3 bg-gray-100 rounded w-4/6"></div>
          </div>

          {/* Details skeleton */}
          <div className="space-y-3 mb-4">
            <div className="flex gap-4">
              <div className="h-4 bg-gray-100 rounded w-20"></div>
              <div className="h-4 bg-gray-100 rounded w-24"></div>
            </div>
            <div className="flex gap-4">
              <div className="h-4 bg-gray-100 rounded w-16"></div>
              <div className="h-4 bg-gray-100 rounded w-28"></div>
            </div>
          </div>
        </div>

        {/* Action buttons skeleton */}
        <div className={`${viewMode === 'list' ? 'flex flex-col space-y-2 min-w-[140px]' : 'flex justify-between items-center pt-4 space-x-2'}`}>
          <div className={`h-9 bg-gray-200 rounded ${viewMode === 'list' ? 'w-full' : 'w-28'}`}></div>
          <div className={`h-9 bg-gray-100 rounded ${viewMode === 'list' ? 'w-full' : 'w-24'}`}></div>
        </div>
      </div>
    </CardContent>
  </Card>
);

/**
 * Skeleton component for the entire programs page
 */
const ProgramsPageSkeleton = ({ viewMode = "grid" }) => (
  <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
    {/* Header skeleton */}
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
          
          <div className="text-center flex-1 mx-4">
            <div className="h-7 bg-gray-200 rounded mb-2 w-64 mx-auto animate-pulse"></div>
            <div className="h-4 bg-gray-100 rounded w-32 mx-auto animate-pulse"></div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </header>

    {/* Main content skeleton */}
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search and filter bar skeleton */}
      <div className="mb-8 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:space-x-4">
        <div className="relative flex-1 max-w-md">
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="h-10 bg-gray-200 rounded-lg w-40 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
        </div>
      </div>

      {/* Programs grid/list skeleton */}
      <div className={`${viewMode === 'grid' 
        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
        : 'space-y-6'
      }`}>
        {Array.from({ length: 6 }, (_, index) => (
          <ProgramCardSkeleton key={index} viewMode={viewMode} />
        ))}
      </div>
    </main>
  </div>
);

/**
 * Main Programs Page Component
 */
const ProgramsPage = () => {
  const params = useParams();
  const router = useRouter();
  const slug = params?.university;
  
  // State management
  const [allPrograms, setAllPrograms] = useState([]); // Store all programs
  const [universityData, setUniversityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedDegreeType, setSelectedDegreeType] = useState("all");
  const [viewMode, setViewMode] = useState("grid");

  // Debounce search term to avoid excessive API calls or filtering
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  /**
   * Fetch all programs data once when component mounts
   */
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setLoading(true);
        
        const API_BASE_URL =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
        
        // Fetch all programs without any filters
        const url = `${API_BASE_URL}/api/university/${slug}/programs`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch programs: ${response.status}`);
        }
        
        const result = await response.json();
        setAllPrograms(result.programs || []);
        setUniversityData(result);
        
      } catch (err) {
        console.error('Error fetching programs:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPrograms();
    }
  }, [slug]);

  /**
   * Client-side filtering of programs based on search and filter criteria
   */
  const filteredPrograms = useMemo(() => {
    if (!allPrograms.length) return [];

    return allPrograms.filter(program => {
      // Search filter - check multiple fields
      const searchLower = debouncedSearchTerm.toLowerCase().trim();
      const matchesSearch = !searchLower || 
        program.name.toLowerCase().includes(searchLower) ||
        program.description?.toLowerCase().includes(searchLower) ||
        program.department?.name.toLowerCase().includes(searchLower) ||
        program.degreeType?.toLowerCase().includes(searchLower) ||
        program.specializations?.toLowerCase().includes(searchLower);

      // Department filter
      const matchesDepartment = selectedDepartment === "all" || 
        program.department?.id === selectedDepartment;

      // Degree type filter
      const matchesDegreeType = selectedDegreeType === "all" || 
        program.degreeType === selectedDegreeType;

      return matchesSearch && matchesDepartment && matchesDegreeType;
    });
  }, [allPrograms, debouncedSearchTerm, selectedDepartment, selectedDegreeType]);

  /**
   * Get unique departments and degree types for filters
   */
  const filterOptions = useMemo(() => {
    if (!allPrograms.length) return { departments: [], degreeTypes: [] };

    // Get unique departments with program counts
    const departmentMap = new Map();
    const degreeTypeSet = new Set();

    allPrograms.forEach(program => {
      if (program.department) {
        const deptId = program.department.id;
        if (departmentMap.has(deptId)) {
          departmentMap.get(deptId).programCount++;
        } else {
          departmentMap.set(deptId, {
            id: deptId,
            name: program.department.name,
            programCount: 1
          });
        }
      }

      if (program.degreeType) {
        degreeTypeSet.add(program.degreeType);
      }
    });

    return {
      departments: Array.from(departmentMap.values()),
      degreeTypes: Array.from(degreeTypeSet).sort()
    };
  }, [allPrograms]);

  /**
   * Reset all filters
   */
  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedDepartment("all");
    setSelectedDegreeType("all");
  }, []);

  /**
   * Navigation handler
   */
  const handleProgramClick = (programSlug) => {
    router.push(`/dashboard/university/${slug}/programs/${programSlug}`);
  };

  /**
   * Utility functions
   */
  const formatCurrency = (amount, currency = 'USD') => {
  if (amount === null || amount === undefined) return 'Not specified';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
  // Loading state
  if (loading) {
    return <ProgramsPageSkeleton viewMode={viewMode} />;
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Programs</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/dashboard/university/${slug}`)}
                className="text-[#6C7280] hover:text-[#002147]"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to University
              </Button>
            </div>
            
            <div className="text-center flex-1 mx-4">
              <h1 className="text-xl md:text-2xl font-bold text-[#002147]">
                {universityData?.university?.name} - Programs
              </h1>
              <div className="flex items-center justify-center mt-1 text-sm text-gray-600">
                <GraduationCap className="h-4 w-4 mr-1" />
                {filteredPrograms.length} of {allPrograms.length} Program{allPrograms.length !== 1 ? 's' : ''}
                {(debouncedSearchTerm || selectedDepartment !== "all" || selectedDegreeType !== "all") && " (filtered)"}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and filter controls */}
        <div className="mb-8 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search programs, departments, specializations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3598FE] focus:border-transparent transition-all duration-200"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            {/* Department filter */}
            <div className="flex items-center space-x-2">
              <Building2 className="h-4 w-4 text-gray-500" />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#3598FE] focus:border-transparent transition-all duration-200"
              >
                <option value="all">All Departments</option>
                {filterOptions.departments.map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.programCount})
                  </option>
                ))}
              </select>
            </div>

            {/* Degree type filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={selectedDegreeType}
                onChange={(e) => setSelectedDegreeType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#3598FE] focus:border-transparent transition-all duration-200"
              >
                <option value="all">All Degrees</option>
                {filterOptions.degreeTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Clear filters button */}
            {(debouncedSearchTerm || selectedDepartment !== "all" || selectedDegreeType !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="text-gray-600 hover:text-gray-800"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Programs display */}
        {filteredPrograms.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {allPrograms.length === 0 ? "No Programs Available" : "No Programs Found"}
            </h3>
            <p className="text-gray-500 mb-4">
              {allPrograms.length === 0 
                ? "No programs are available at this university." 
                : "Try adjusting your search criteria or filters."}
            </p>
            {(debouncedSearchTerm || selectedDepartment !== "all" || selectedDegreeType !== "all") && (
              <Button onClick={resetFilters} variant="outline">
                Clear All Filters
              </Button>
            )}
          </div>
        ) : (
          <div className={`${viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-6'
          }`}>
            {filteredPrograms.map((program) => (
              <Card 
                key={program.id} 
                className={`hover:shadow-xl transition-all duration-300 border-0 bg-white ${
                  viewMode === 'grid' ? 'hover:scale-[1.02]' : ''
                } cursor-pointer`}
                onClick={() => handleProgramClick(program.slug)}
              >
                <CardContent className="p-6">
                  <div className={`${viewMode === 'list' ? 'flex items-start justify-between' : ''}`}>
                    <div className={`${viewMode === 'list' ? 'flex-1 pr-6' : ''}`}>
                      {/* Program header */}
                      <div className="flex items-start mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#002147] to-[#3598FE] rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                          <GraduationCap className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-[#002147] line-clamp-2">{program.name}</h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {program.degreeType && (
                              <span className="px-2 py-1 bg-[#3598FE]/10 text-[#3598FE] rounded-full text-xs font-medium">
                                {program.degreeType}
                              </span>
                            )}
                            {program.department && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                {program.department.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Program description */}
                      {program.description && (
                        <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                          {program.description}
                        </p>
                      )}

                      {/* Program details */}
                      <div className="space-y-3 mb-4">
                        <div className="flex flex-wrap gap-4 text-sm">
                          {program.duration && (
                            <div className="flex items-center text-gray-600">
                              <Clock className="h-4 w-4 mr-1" />
                              {formatDuration(program.duration)}
                            </div>
                          )}
                          {program.tuitionFees && (
                            <div className="flex items-center text-green-600">
                              <DollarSign className="h-4 w-4 mr-1" />
                              {formatCurrency(program.tuitionFees) || ""}
                            </div>
                          )}
                        </div>

                        {(program.latestRanking || program.averageEntranceScore) && (
                          <div className="flex flex-wrap gap-4 text-sm">
                            {program.latestRanking && (
                              <div className="flex items-center text-yellow-600">
                                <TrendingUp className="h-4 w-4 mr-1" />
                                Rank #{program.latestRanking.rank} ({program.latestRanking.year})
                              </div>
                            )}
                            {program.averageEntranceScore && (
                              <div className="flex items-center text-blue-600">
                                <Award className="h-4 w-4 mr-1" />
                                Avg Score: {program.averageEntranceScore}
                              </div>
                            )}
                          </div>
                        )}

                        {program.specializations && (
                          <div className="text-sm">
                            <span className="text-gray-500">Specializations: </span>
                            <span className="text-gray-700">{program.specializations}</span>
                          </div>
                        )}

                        {program.scholarships && program.scholarships.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs text-gray-500 mr-2">Scholarships:</span>
                            {program.scholarships.slice(0, 2).map((scholarship) => (
                              <span
                                key={scholarship.id}
                                className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs"
                              >
                                {formatCurrency(scholarship.amount, scholarship.currency)}
                              </span>
                            ))}
                            {program.scholarships.length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                +{program.scholarships.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className={`${viewMode === 'list' ? 'flex flex-col space-y-2 min-w-[140px]' : 'flex justify-between items-center pt-4'}`}>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProgramClick(program.slug);
                        }}
                        className="bg-[#002147] hover:bg-[#001a36] text-white"
                        size={viewMode === 'list' ? 'sm' : 'default'}
                      >
                        View Details
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        disabled
                       //logic
                        size={viewMode === 'list' ? 'sm' : 'default'}
                        className="border-[#3598FE] text-[#3598FE] hover:bg-[#3598FE] hover:text-white"
                      >
                        Apply Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Statistics */}
        {allPrograms.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-[#002147] mb-2">{filteredPrograms.length}</div>
              <div className="text-gray-600 text-sm">
                {filteredPrograms.length === allPrograms.length ? "Total Programs" : "Filtered Programs"}
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-[#3598FE] mb-2">{filterOptions.departments.length}</div>
              <div className="text-gray-600 text-sm">Departments</div>
            </div>
            
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-green-600 mb-2">{filterOptions.degreeTypes.length}</div>
              <div className="text-gray-600 text-sm">Degree Types</div>
            </div>
            
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {filteredPrograms.filter(p => p.scholarships && p.scholarships.length > 0).length}
              </div>
              <div className="text-gray-600 text-sm">With Scholarships</div>
            </div>
          </div>
        )}

        {/* Quick navigation */}
        <div className="mt-12 bg-[#002147] rounded-2xl p-8 text-white">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Explore More</h2>
            <p className="text-gray-300">Discover everything {universityData?.university?.name} has to offer</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Button
              variant="secondary"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 py-14 flex flex-col items-center space-y-2"
            >
              <Building2 className="h-8 w-8" />
              <div className="text-center">
                <div className="font-bold">Departments</div>
                <div className="text-sm opacity-80">Browse by department</div>
              </div>
            </Button>
            
            <Button
              variant="secondary"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 py-14 flex flex-col items-center space-y-2"
            >
              <Award className="h-8 w-8" />
              <div className="text-center">
                <div className="font-bold">University Profile</div>
                <div className="text-sm opacity-80">Back to main page</div>
              </div>
            </Button>
            
            <Button
              variant="secondary"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 py-14 flex flex-col items-center space-y-2"
            >
              <FileText className="h-8 w-8" />
              <div className="text-center">
                <div className="font-bold">Admissions</div>
                <div className="text-sm opacity-80">Application information</div>
              </div>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProgramsPage;