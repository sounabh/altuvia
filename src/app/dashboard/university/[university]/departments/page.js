"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, Building2, Users, BookOpen, 
  GraduationCap, ChevronRight, Search,
  Filter, Grid, List, MapPin, Award
} from 'lucide-react';

/**
 * Skeleton component for individual department cards
 * Shows loading state while data is being fetched
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.viewMode - Current view mode ('grid' or 'list')
 * @returns {React.ReactElement} Skeleton loading card
 */
const DepartmentCardSkeleton = ({ viewMode }) => (
  <Card className={`animate-pulse border-0 bg-white ${viewMode === 'grid' ? '' : ''}`}>
    <CardContent className="p-6">
      <div className={`${viewMode === 'list' ? 'flex items-start justify-between' : ''}`}>
        <div className={`${viewMode === 'list' ? 'flex-1 pr-6' : ''}`}>
          {/* Department header skeleton */}
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-lg mr-4"></div>
            <div>
              <div className="h-5 bg-gray-200 rounded mb-1 w-32"></div>
              <div className="h-3 bg-gray-100 rounded w-24"></div>
            </div>
          </div>

          {/* Description skeleton */}
          <div className="space-y-2 mb-4">
            <div className="h-3 bg-gray-100 rounded w-full"></div>
            <div className="h-3 bg-gray-100 rounded w-5/6"></div>
            <div className="h-3 bg-gray-100 rounded w-4/6"></div>
          </div>

          {/* Programs preview skeleton */}
          <div className="mb-4">
            <div className="h-4 bg-gray-200 rounded mb-2 w-20"></div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: viewMode === 'grid' ? 3 : 5 }, (_, index) => (
                <div key={index} className="h-6 bg-gray-100 rounded-full w-16"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Action buttons skeleton */}
        <div className={`${viewMode === 'list' ? 'flex flex-col space-y-2' : 'flex justify-between items-center pt-4 space-x-2'}`}>
          <div className={`h-9 bg-gray-200 rounded ${viewMode === 'list' ? 'w-24' : 'w-28'}`}></div>
          <div className={`h-9 bg-gray-100 rounded ${viewMode === 'list' ? 'w-24' : 'w-28'}`}></div>
        </div>
      </div>
    </CardContent>
  </Card>
);

/**
 * Skeleton component for the entire departments page
 * Shows loading state while data is being fetched
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.viewMode - Current view mode ('grid' or 'list')
 * @returns {React.ReactElement} Complete page skeleton
 */
const DepartmentsPageSkeleton = ({ viewMode = "grid" }) => (
  <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
    {/* Header skeleton */}
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-8 bg-gray-200 rounded w-36 animate-pulse"></div>
          </div>
          
          <div className="text-center flex-1 mx-4">
            <div className="h-7 bg-gray-200 rounded mb-2 w-72 mx-auto animate-pulse"></div>
            <div className="h-4 bg-gray-100 rounded w-40 mx-auto animate-pulse"></div>
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
      <div className="mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="h-10 bg-gray-200 rounded-lg w-36 animate-pulse"></div>
        </div>
      </div>

      {/* Departments grid/list skeleton */}
      <div className={`${viewMode === 'grid' 
        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
        : 'space-y-4'
      }`}>
        {/* Generate 6 skeleton cards */}
        {Array.from({ length: 6 }, (_, index) => (
          <DepartmentCardSkeleton key={index} viewMode={viewMode} />
        ))}
      </div>

      {/* Quick navigation skeleton */}
      <div className="mt-12 bg-gray-200 rounded-2xl p-8 animate-pulse">
        <div className="text-center mb-8">
          <div className="h-7 bg-gray-300 rounded mb-2 w-32 mx-auto"></div>
          <div className="h-4 bg-gray-300 rounded w-48 mx-auto"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="bg-gray-300 rounded py-14 px-4 flex flex-col items-center space-y-2">
              <div className="h-8 w-8 bg-gray-400 rounded"></div>
              <div className="h-4 bg-gray-400 rounded w-24"></div>
              <div className="h-3 bg-gray-400 rounded w-32"></div>
            </div>
          ))}
        </div>
      </div>
    </main>
  </div>
);

/**
 * Main DepartmentsPage component
 * Displays all departments for a university with search, filter, and view options
 * 
 * @component
 * @returns {React.ReactElement} Departments listing page
 */
const DepartmentsPage = () => {
  const params = useParams();
  const router = useRouter();
  const slug = params?.university;
  
  // State management for departments data and filters
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // Toggle between grid and list view
  const [filterBy, setFilterBy] = useState("all"); // Filter departments by program availability

  // Effect hook to fetch departments data when component mounts
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(true);
        
        // Get API base URL from environment or use localhost as fallback
        const API_BASE_URL =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
        
        // Fetch departments data from API
        const response = await fetch(`${API_BASE_URL}/api/university/${slug}/departments`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch departments: ${response.status}`);
        }
        
        const result = await response.json();
        setData(result);
        
      } catch (err) {
        console.error('Error fetching departments:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we have a university slug
    if (slug) {
      fetchDepartments();
    }
  }, [slug]);

  // Filter departments based on search term and filter criteria
  const filteredDepartments = data?.departments?.filter(dept => {
    // Search matching logic - check name and description
    const matchesSearch = dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter matching logic - check program availability
    const matchesFilter = filterBy === "all" || 
                         (filterBy === "with-programs" && dept.programs.length > 0) ||
                         (filterBy === "no-programs" && dept.programs.length === 0);
    
    return matchesSearch && matchesFilter;
  }) || [];

  // Navigation handler for department details page
  const handleDepartmentClick = (departmentId) => {
    router.push(`/dashboard/university/${slug}/departments/${departmentId}`);
  };

  // Navigation handler for program details page
  const handleProgramClick = (programId) => {
    router.push(`/dashboard/university/${slug}/programs/${programId}`);
  };

  // Show skeleton loader while data is being fetched
  if (loading) {
    return <DepartmentsPageSkeleton viewMode={viewMode} />;
  }

  // Show error state if data fetching failed
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Departments</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main component render
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header section with navigation and view toggles */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Back button */}
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
            
            {/* Page title and department count */}
            <div className="text-center flex-1 mx-4">
              <h1 className="text-xl md:text-2xl font-bold text-[#002147]">
                {data?.university?.name} - Departments
              </h1>
              <div className="flex items-center justify-center mt-1 text-sm text-gray-600">
                <Building2 className="h-4 w-4 mr-1" />
                {filteredDepartments.length} Department{filteredDepartments.length !== 1 ? 's' : ''} Available
              </div>
            </div>
            
            {/* View mode toggle buttons (grid/list) */}
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

      {/* Main content area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and filter controls */}
        <div className="mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
          {/* Search input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3598FE] focus:border-transparent"
            />
          </div>
          
          {/* Filter controls */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              {/* Filter dropdown for department availability */}
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#3598FE] focus:border-transparent"
              >
                <option value="all">All Departments</option>
                <option value="with-programs">With Programs</option>
                <option value="no-programs">Without Programs</option>
              </select>
            </div>
          </div>
        </div>

        {/* Departments display section */}
        {filteredDepartments.length === 0 ? (
          // Empty state when no departments are found
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Departments Found</h3>
            <p className="text-gray-500">
              {searchTerm ? "Try adjusting your search criteria." : "No departments are available at this time."}
            </p>
          </div>
        ) : (
          // Departments grid or list display
          <div className={`${viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
          }`}>
            {filteredDepartments.map((department, index) => (
              <Card 
                key={department.id} 
                className={`hover:shadow-lg transition-all duration-300 border-0 bg-white ${
                  viewMode === 'grid' ? 'hover:scale-[1.02]' : ''
                }`}
              >
                <CardContent className="p-6">
                  <div className={`${viewMode === 'list' ? 'flex items-start justify-between' : ''}`}>
                    <div className={`${viewMode === 'list' ? 'flex-1 pr-6' : ''}`}>
                      {/* Department header with icon, name, and program count */}
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-[#002147] rounded-lg flex items-center justify-center mr-4">
                          <Building2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-[#002147]">{department.name}</h3>
                          <div className="flex items-center text-sm text-gray-500">
                            <GraduationCap className="h-3 w-3 mr-1" />
                            {department.programs.length} Program{department.programs.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>

                      {/* Department description */}
                      {department.description && (
                        <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                          {department.description}
                        </p>
                      )}

                      {/* Programs preview section */}
                      {department.programs.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-[#002147] mb-2">Programs:</h4>
                          <div className="flex flex-wrap gap-2">
                            {/* Show limited number of programs based on view mode */}
                            {department.programs.slice(0, viewMode === 'grid' ? 3 : 5).map((program) => (
                              <span
                                key={program.id}
                                onClick={() => handleProgramClick(program.id)}
                                className="px-3 py-1 bg-[#3598FE]/10 text-[#3598FE] rounded-full text-xs font-medium hover:bg-[#3598FE] hover:text-white cursor-pointer transition-colors"
                              >
                                {program.name}
                              </span>
                            ))}
                            {/* Show count for additional programs */}
                            {department.programs.length > (viewMode === 'grid' ? 3 : 5) && (
                              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                +{department.programs.length - (viewMode === 'grid' ? 3 : 5)} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action buttons section */}
                    <div className={`${viewMode === 'list' ? 'flex flex-col space-y-2' : 'flex justify-between items-center pt-4'}`}>
                      {/* View department details button */}
                      <Button
                        variant="default"
                        //onClick={() => handleDepartmentClick(department.id)}
                        disabled
                        size={viewMode === 'list' ? 'sm' : 'default'}
                        className="bg-[#3598FE] hover:bg-[#2485ed]"
                      >
                        View Details
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                      
                      {/* View programs button (only shown if department has programs) */}
                      {department.programs.length > 0 && (
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/dashboard/university/${slug}/programs`)}
                          size={viewMode === 'list' ? 'sm' : 'default'}
                          className="border-[#3598FE] text-[#3598FE] hover:bg-[#3598FE] hover:text-white"
                        >
                          View Programs
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick navigation section */}
        <div className="mt-12 bg-[#002147] rounded-2xl p-8 text-white">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Explore More</h2>
            <p className="text-gray-300">Discover everything {data?.university?.name} has to offer</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Navigate to all programs */}
            <Button
              variant="secondary"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 py-14 flex flex-col items-center space-y-2"
              onClick={() => router.push(`/dashboard/university/${slug}/programs`)}
            >
              <GraduationCap className="h-8 w-8" />
              <div className="text-center">
                <div className="font-bold">All Programs</div>
                <div className="text-sm opacity-80">View complete program list</div>
              </div>
            </Button>
            
            {/* Navigate to university profile */}
            <Button
              variant="secondary"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 py-14 flex flex-col items-center space-y-2"
              onClick={() => router.push(`/university/${slug}`)}
            >
              <Award className="h-8 w-8" />
              <div className="text-center">
                <div className="font-bold">University Profile</div>
                <div className="text-sm opacity-80">Back to main page</div>
              </div>
            </Button>
            
            {/* Navigate to admissions */}
            <Button
              variant="secondary"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 py-14 flex flex-col items-center space-y-2"
             // onClick={() => router.push(`/university/${slug}/admissions`)}
            >
              <BookOpen className="h-8 w-8" />
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

export default DepartmentsPage;