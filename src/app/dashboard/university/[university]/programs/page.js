"use client"

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, GraduationCap, Users, BookOpen, 
  Clock, DollarSign, ChevronRight, Search,
  Filter, Grid, List, MapPin, Award, Star,
  Building2, Calendar, TrendingUp, FileText
} from 'lucide-react';

const ProgramsPage = () => {
  const params = useParams();
  const router = useRouter();
  const slug = params?.university;
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedDegreeType, setSelectedDegreeType] = useState("all");

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setLoading(true);
        
        const API_BASE_URL =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
        
        // Build query parameters
        const queryParams = new URLSearchParams();
        if (selectedDepartment !== "all") queryParams.append("department", selectedDepartment);
        if (selectedDegreeType !== "all") queryParams.append("degreeType", selectedDegreeType);
        if (searchTerm) queryParams.append("search", searchTerm);
        
        const queryString = queryParams.toString();
        const url = `${API_BASE_URL}/api/university/${slug}/programs${queryString ? `?${queryString}` : ''}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch programs: ${response.status}`);
        }
        
        const result = await response.json();
        setData(result);
        
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
  }, [slug, selectedDepartment, selectedDegreeType, searchTerm]);

  const handleProgramClick = (programSlug) => {
    router.push(`/dashboard/university/${slug}/programs/${programSlug}`);
  };

  const formatCurrency = (amount, currency = 'USD') => {
    if (!amount) return 'Not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDuration = (months) => {
    if (!months) return 'Not specified';
    if (months === 12) return '1 year';
    if (months < 12) return `${months} months`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) return `${years} year${years > 1 ? 's' : ''}`;
    return `${years} year${years > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#002147] mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading programs...</p>
          </div>
        </div>
      </div>
    );
  }

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
                onClick={() => router.push(`/university/${slug}`)}
                className="text-[#6C7280] hover:text-[#002147]"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to University
              </Button>
            </div>
            
            <div className="text-center flex-1 mx-4">
              <h1 className="text-xl md:text-2xl font-bold text-[#002147]">
                {data?.university?.name} - Programs
              </h1>
              <div className="flex items-center justify-center mt-1 text-sm text-gray-600">
                <GraduationCap className="h-4 w-4 mr-1" />
                {data?.programs?.length || 0} Program{data?.programs?.length !== 1 ? 's' : ''} Available
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Bar */}
        <div className="mb-8 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search programs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3598FE] focus:border-transparent"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            {/* Department Filter */}
            <div className="flex items-center space-x-2">
              <Building2 className="h-4 w-4 text-gray-500" />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#3598FE] focus:border-transparent"
              >
                <option value="all">All Departments</option>
                {data?.departments?.map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.programCount})
                  </option>
                ))}
              </select>
            </div>

            {/* Degree Type Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={selectedDegreeType}
                onChange={(e) => setSelectedDegreeType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#3598FE] focus:border-transparent"
              >
                <option value="all">All Degrees</option>
                {data?.degreeTypes?.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Programs Grid/List */}
        {!data?.programs || data.programs.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Programs Found</h3>
            <p className="text-gray-500">
              {searchTerm || selectedDepartment !== "all" || selectedDegreeType !== "all" 
                ? "Try adjusting your search criteria." 
                : "No programs are available at this time."}
            </p>
          </div>
        ) : (
          <div className={`${viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-6'
          }`}>
            {data.programs.map((program) => (
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
                      {/* Program Header */}
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

                      {/* Program Description */}
                      {program.description && (
                        <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                          {program.description}
                        </p>
                      )}

                      {/* Program Details */}
                      <div className="space-y-3 mb-4">
                        {/* Duration & Fees Row */}
                        <div className="flex flex-wrap gap-4 text-sm">
                          {program.duration && (
                            <div className="flex items-center text-gray-600">
                              <Clock className="h-4 w-4 mr-1" />
                              {formatDuration(program.duration * 12)} {/* Convert years to months for formatDuration */}
                            </div>
                          )}
                          {program.tuitionFees && (
                            <div className="flex items-center text-green-600">
                              <DollarSign className="h-4 w-4 mr-1" />
                              {formatCurrency(program.tuitionFees)}
                            </div>
                          )}
                        </div>

                        {/* Ranking & Score Row */}
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

                        {/* Specializations */}
                        {program.specializations && (
                          <div className="text-sm">
                            <span className="text-gray-500">Specializations: </span>
                            <span className="text-gray-700">{program.specializations}</span>
                          </div>
                        )}

                        {/* Scholarships */}
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

                    {/* Action Buttons */}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/university/${slug}/apply/${program.slug}`);
                        }}
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

        {/* Quick Stats */}
        {data?.programs && data.programs.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-[#002147] mb-2">{data.programs.length}</div>
              <div className="text-gray-600 text-sm">Total Programs</div>
            </div>
            
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-[#3598FE] mb-2">{data.departments?.length || 0}</div>
              <div className="text-gray-600 text-sm">Departments</div>
            </div>
            
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {data.degreeTypes?.length || 0}
              </div>
              <div className="text-gray-600 text-sm">Degree Types</div>
            </div>
            
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {data.programs.filter(p => p.scholarships && p.scholarships.length > 0).length}
              </div>
              <div className="text-gray-600 text-sm">With Scholarships</div>
            </div>
          </div>
        )}

        {/* Quick Navigation */}
        <div className="mt-12 bg-[#002147] rounded-2xl p-8 text-white">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Explore More</h2>
            <p className="text-gray-300">Discover everything {data?.university?.name} has to offer</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Button
              variant="secondary"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 py-6 flex flex-col items-center space-y-2"
              onClick={() => router.push(`/university/${slug}/departments`)}
            >
              <Building2 className="h-8 w-8" />
              <div className="text-center">
                <div className="font-bold">Departments</div>
                <div className="text-sm opacity-80">Browse by department</div>
              </div>
            </Button>
            
            <Button
              variant="secondary"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 py-6 flex flex-col items-center space-y-2"
              onClick={() => router.push(`/university/${slug}`)}
            >
              <Award className="h-8 w-8" />
              <div className="text-center">
                <div className="font-bold">University Profile</div>
                <div className="text-sm opacity-80">Back to main page</div>
              </div>
            </Button>
            
            <Button
              variant="secondary"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 py-6 flex flex-col items-center space-y-2"
              onClick={() => router.push(`/university/${slug}/admissions`)}
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