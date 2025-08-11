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

const DepartmentsPage = () => {
  const params = useParams();
  const router = useRouter();
  const slug = params?.university;
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [filterBy, setFilterBy] = useState("all");

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(true);
        
        const API_BASE_URL =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
        
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

    if (slug) {
      fetchDepartments();
    }
  }, [slug]);

  const filteredDepartments = data?.departments?.filter(dept => {
    const matchesSearch = dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterBy === "all" || 
                         (filterBy === "with-programs" && dept.programs.length > 0) ||
                         (filterBy === "no-programs" && dept.programs.length === 0);
    
    return matchesSearch && matchesFilter;
  }) || [];

  const handleDepartmentClick = (departmentId) => {
    router.push(`/university/${slug}/departments/${departmentId}`);
  };

  const handleProgramClick = (programId) => {
    router.push(`/university/${slug}/programs/${programId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#002147] mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading departments...</p>
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
                {data?.university?.name} - Departments
              </h1>
              <div className="flex items-center justify-center mt-1 text-sm text-gray-600">
                <Building2 className="h-4 w-4 mr-1" />
                {filteredDepartments.length} Department{filteredDepartments.length !== 1 ? 's' : ''} Available
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
        <div className="mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
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
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
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

        {/* Departments Grid/List */}
        {filteredDepartments.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Departments Found</h3>
            <p className="text-gray-500">
              {searchTerm ? "Try adjusting your search criteria." : "No departments are available at this time."}
            </p>
          </div>
        ) : (
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

                      {department.description && (
                        <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                          {department.description}
                        </p>
                      )}

                      {/* Programs Preview */}
                      {department.programs.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-[#002147] mb-2">Programs:</h4>
                          <div className="flex flex-wrap gap-2">
                            {department.programs.slice(0, viewMode === 'grid' ? 3 : 5).map((program) => (
                              <span
                                key={program.id}
                                onClick={() => handleProgramClick(program.id)}
                                className="px-3 py-1 bg-[#3598FE]/10 text-[#3598FE] rounded-full text-xs font-medium hover:bg-[#3598FE] hover:text-white cursor-pointer transition-colors"
                              >
                                {program.name}
                              </span>
                            ))}
                            {department.programs.length > (viewMode === 'grid' ? 3 : 5) && (
                              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                +{department.programs.length - (viewMode === 'grid' ? 3 : 5)} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className={`${viewMode === 'list' ? 'flex flex-col space-y-2' : 'flex justify-between items-center pt-4'}`}>
                      <Button
                        onClick={() => handleDepartmentClick(department.id)}
                        className="bg-[#002147] hover:bg-[#001a36] text-white"
                        size={viewMode === 'list' ? 'sm' : 'default'}
                      >
                        View Details
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                      
                      {department.programs.length > 0 && (
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/dashboard//university/${slug}/programs`)}
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
              onClick={() => router.push(`/university/${slug}/programs`)}
            >
              <GraduationCap className="h-8 w-8" />
              <div className="text-center">
                <div className="font-bold">All Programs</div>
                <div className="text-sm opacity-80">View complete program list</div>
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