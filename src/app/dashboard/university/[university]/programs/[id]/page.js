"use client"

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, GraduationCap, Clock, DollarSign, 
  MapPin, Award, BookOpen, Users, Star,
  Download, ExternalLink, FileText, Calendar,
  TrendingUp, Building2, CheckCircle, Info,
  ChevronRight
} from 'lucide-react';

// =============================================================================
// SKELETON COMPONENTS
// =============================================================================

/**
 * Skeleton component for loading state placeholder
 * @param {string} className - Additional CSS classes for styling
 */
const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
);

/**
 * Skeleton text component with multiple lines
 * @param {number} lines - Number of text lines to display
 * @param {string} className - Additional CSS classes for styling
 */
const SkeletonText = ({ lines = 1, className = "" }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton 
        key={i} 
        className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} 
      />
    ))}
  </div>
);

/**
 * Complete skeleton loading component for the program details page
 * Shows placeholder content while data is being fetched
 */
const HeaderSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
    {/* Header Skeleton */}
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </header>

    {/* Hero Section Skeleton */}
    <div className="bg-gradient-to-r from-[#002147] to-[#3598FE] text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-4">
              <Skeleton className="w-16 h-16 rounded-xl bg-white/20" />
              <div className="flex-1">
                <Skeleton className="h-8 w-96 mb-2 bg-white/20" />
                <div className="flex flex-wrap items-center gap-4">
                  <Skeleton className="h-4 w-32 bg-white/20" />
                  <Skeleton className="h-4 w-24 bg-white/20" />
                  <Skeleton className="h-4 w-28 bg-white/20" />
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Skeleton className="h-8 w-20 rounded-full bg-white/20" />
              <Skeleton className="h-8 w-16 rounded-full bg-white/20" />
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Quick Stats Skeleton */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-white shadow-lg">
            <CardContent className="p-4 text-center">
              <Skeleton className="h-6 w-6 mx-auto mb-2" />
              <Skeleton className="h-4 w-16 mx-auto mb-1" />
              <Skeleton className="h-5 w-20 mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>

    {/* Main Content Skeleton */}
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Navigation Tabs Skeleton */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-2 py-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </nav>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area Skeleton */}
        <div className="lg:col-span-2 space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Skeleton className="h-5 w-5 mr-2" />
                  <Skeleton className="h-5 w-32" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SkeletonText lines={4} />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sidebar Skeleton */}
        <div className="space-y-6">
          {/* Quick Apply Card Skeleton */}
          <Card className="bg-gradient-to-br from-[#002147] to-[#3598FE]">
            <CardContent className="p-6">
              <Skeleton className="h-6 w-32 mb-4 bg-white/20" />
              <Skeleton className="h-4 w-48 mb-4 bg-white/20" />
              <Skeleton className="h-10 w-full bg-white/20 rounded" />
            </CardContent>
          </Card>

          {/* University Info Skeleton */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Skeleton className="h-5 w-5 mr-2" />
                <Skeleton className="h-5 w-32" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Skeleton className="h-5 w-40 mb-1" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div>
                <Skeleton className="h-3 w-16 mb-1" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-8 w-full rounded" />
            </CardContent>
          </Card>

          {/* Contact Info Skeleton */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Skeleton className="h-5 w-5 mr-2" />
                <Skeleton className="h-5 w-24" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <SkeletonText lines={2} />
              <Skeleton className="h-8 w-full rounded" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Related Programs Skeleton */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-9 w-32" />
        </div>
        
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Skeleton className="h-4 w-48 mx-auto mb-4" />
          <Skeleton className="h-9 w-32 mx-auto" />
        </div>
      </div>
    </main>
  </div>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * ProgramDetailsPage Component
 * Displays detailed information about a specific university program
 * Includes tabs for overview, curriculum, admissions, fees & aid, and rankings
 */
const ProgramDetailsPage = () => {
  // Router and params for navigation and URL parameters
  const params = useParams();
  const router = useRouter();
  const { university: slug, id } = params;
  
  // State management for program data, loading, and error handling
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch program details on component mount
  useEffect(() => {
    const fetchProgramDetails = async () => {
      try {
        setLoading(true);
        
        const API_BASE_URL =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
        
        const response = await fetch(`${API_BASE_URL}/api/university/${slug}/programs/${id}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch program details: ${response.status}`);
        }
        
        const result = await response.json();
        setData(result);
        
      } catch (err) {
        console.error('Error fetching program details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (slug && id) {
      fetchProgramDetails();
    }
  }, [slug, id]);

  /**
   * Format currency amount with proper formatting
   * @param {number} amount - The amount to format
   * @param {string} currency - Currency code (default: USD)
   * @returns {string} Formatted currency string
   */
  const formatCurrency = (amount, currency = 'USD') => {
    if (!amount) return 'Contact university';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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

  // Show skeleton loading state while data is being fetched
  if (loading) {
    return <HeaderSkeleton />;
  }

  // Show error state if data fetching fails
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Program Not Found</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => router.push(`/dashboard/university/${slug}/programs`)}>
              Back to Programs
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Destructure data from API response
  const { program, university, department, rankings, scholarships, financialAids, externalLinks, syllabus, essayPrompts } = data;

  // Tab configuration for program details navigation
  const tabs = [
    { id: "overview", label: "Overview", icon: Info },
    { id: "curriculum", label: "Curriculum", icon: BookOpen },
    { id: "admissions", label: "Admissions", icon: FileText },
    { id: "fees", label: "Fees & Aid", icon: DollarSign },
    { id: "rankings", label: "Rankings", icon: TrendingUp }
  ];

  // ===========================================================================
  // RENDER
  // ===========================================================================

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/dashboard/university/${slug}/programs`)}
              className="text-[#6C7280] hover:text-[#002147]"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Programs
            </Button>
            
            <div className="flex items-center space-x-4">
              <Button
                //onClick={() => router.push(`/university/${slug}/apply/${program.slug}`)}
                disabled
                className="bg-[#3598FE] hover:bg-[#2980E6] text-white"
              >
                Apply Now
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#002147] to-[#3598FE] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl text-white font-bold mb-2">{program.name}</h1>
                  <div className="flex flex-wrap items-center gap-4 text-white/80">
                    <div className="flex items-center">
                      <Building2 className="h-4 w-4 mr-1" />
                      {university.name}
                    </div>
                    {department && (
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-1" />
                        {department.name}
                      </div>
                    )}
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {university.city}, {university.country}
                    </div>
                  </div>
                </div>
              </div>
              
              {program.degreeType && (
                <div className="flex items-center space-x-3">
                  <span className="px-4 py-2 bg-white/20 rounded-full text-sm font-medium">
                    {program.degreeType}
                  </span>
                  {program.duration && (
                    <span className="px-4 py-2 bg-white/20 rounded-full text-sm font-medium">
                      {formatDuration(program.duration)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white shadow-lg">
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 text-[#3598FE] mx-auto mb-2" />
              <div className="text-sm text-gray-600">Duration</div>
              <div className="font-bold text-[#002147]">{formatDuration(program.duration)}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-lg">
            <CardContent className="p-4 text-center">
              <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="text-sm text-gray-600">Tuition</div>
              <div className="font-bold text-[#002147]">{formatCurrency(program.tuitionFees)}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-lg">
            <CardContent className="p-4 text-center">
              <Award className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
              <div className="text-sm text-gray-600">Avg Score</div>
              <div className="font-bold text-[#002147]">
                {program.averageEntranceScore || 'Not specified'}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-lg">
            <CardContent className="p-4 text-center">
              <Star className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <div className="text-sm text-gray-600">Scholarships</div>
              <div className="font-bold text-[#002147]">{scholarships?.length || 0}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-[#3598FE] text-[#3598FE]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-[#002147]">
                      <Info className="h-5 w-5 mr-2" />
                      Program Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {program.description ? (
                      <p className="text-gray-700 leading-relaxed">{program.description}</p>
                    ) : (
                      <p className="text-gray-500 italic">No description available</p>
                    )}
                  </CardContent>
                </Card>

                {program.specializations && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-[#002147]">
                        <Star className="h-5 w-5 mr-2" />
                        Specializations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{program.specializations}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeTab === "curriculum" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-[#002147]">
                      <BookOpen className="h-5 w-5 mr-2" />
                      Curriculum Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {program.curriculumOverview ? (
                      <div className="prose prose-sm max-w-none">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                          {program.curriculumOverview}
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">Curriculum details not available</p>
                    )}
                  </CardContent>
                </Card>

                {syllabus && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-[#002147]">
                        <Download className="h-5 w-5 mr-2" />
                        Syllabus
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => window.open(syllabus.fileUrl, '_blank')}
                        className="bg-[#3598FE] hover:bg-[#2980E6] text-white"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Syllabus PDF
                      </Button>
                      <p className="text-sm text-gray-600 mt-2">
                        Uploaded: {new Date(syllabus.uploadedAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {externalLinks && externalLinks.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-[#002147]">
                        <ExternalLink className="h-5 w-5 mr-2" />
                        External Resources
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {externalLinks.map((link) => (
                          <div key={link.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium text-gray-800">{link.title}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(link.url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Visit
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeTab === "admissions" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-[#002147]">
                      <FileText className="h-5 w-5 mr-2" />
                      Admission Requirements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {program.admissionRequirements ? (
                      <div className="prose prose-sm max-w-none">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                          {program.admissionRequirements}
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">Admission requirements not specified</p>
                    )}
                  </CardContent>
                </Card>

                {program.averageEntranceScore && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-[#002147]">
                        <Award className="h-5 w-5 mr-2" />
                        Entrance Score Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center p-6 bg-blue-50 rounded-lg">
                        <div className="text-3xl font-bold text-[#3598FE] mb-2">
                          {program.averageEntranceScore}
                        </div>
                        <div className="text-gray-600">Average Entrance Score</div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {essayPrompts && essayPrompts.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-[#002147]">
                        <FileText className="h-5 w-5 mr-2" />
                        Essay Prompts
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {essayPrompts.map((prompt, index) => (
                          <div key={prompt.id} className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-[#002147] mb-2">
                              Essay {index + 1}: {prompt.title || 'Untitled'}
                            </h4>
                            <p className="text-gray-700 text-sm">{prompt.prompt}</p>
                            {prompt.wordLimit && (
                              <p className="text-xs text-gray-500 mt-2">
                                Word limit: {prompt.wordLimit}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeTab === "fees" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-[#002147]">
                      <DollarSign className="h-5 w-5 mr-2" />
                      Tuition & Fees
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="text-center p-6 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-[#3598FE] mb-2">
                          {formatCurrency(program.tuitionFees)}
                        </div>
                        <div className="text-gray-600">Tuition Fees</div>
                      </div>
                      
                      {program.additionalFees && (
                        <div className="text-center p-6 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600 mb-2">
                            {formatCurrency(program.additionalFees)}
                          </div>
                          <div className="text-gray-600">Additional Fees</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {scholarships && scholarships.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-[#002147]">
                        <Award className="h-5 w-5 mr-2" />
                        Available Scholarships
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        {scholarships.map((scholarship) => (
                          <div key={scholarship.id} className="p-4 border border-green-200 bg-green-50 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-[#002147]">{scholarship.name}</h4>
                              <span className="font-bold text-green-600">
                                {formatCurrency(scholarship.amount, scholarship.currency)}
                              </span>
                            </div>
                            {scholarship.description && (
                              <p className="text-sm text-gray-700">{scholarship.description}</p>
                            )}
                            {scholarship.eligibilityCriteria && (
                              <p className="text-xs text-gray-600 mt-2">
                                Eligibility: {scholarship.eligibilityCriteria}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {financialAids && financialAids.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-[#002147]">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Financial Aid Options
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {financialAids.map((aid) => (
                          <div key={aid.id} className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                            <h4 className="font-medium text-[#002147] mb-2">{aid.aidType}</h4>
                            {aid.description && (
                              <p className="text-sm text-gray-700 mb-2">{aid.description}</p>
                            )}
                            {aid.maxAmount && (
                              <p className="text-sm font-medium text-blue-600">
                                Up to {formatCurrency(aid.maxAmount, aid.currency)}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeTab === "rankings" && (
              <div className="space-y-6">
                {rankings && rankings.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-[#002147]">
                        <TrendingUp className="h-5 w-5 mr-2" />
                        Program Rankings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {rankings.map((ranking) => (
                          <div key={ranking.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <div>
                              <div className="font-bold text-[#002147]">Rank #{ranking.rank}</div>
                              <div className="text-sm text-gray-600">
                                {ranking.source ? `${ranking.source} - ` : ''}{ranking.year}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-yellow-600">#{ranking.rank}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No Rankings Available</h3>
                      <p className="text-gray-500">Ranking information is not currently available for this program.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Apply Card */}
            <Card className="bg-gradient-to-br from-[#002147] to-[#3598FE] text-white">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4">Ready to Apply?</h3>
                <p className="text-white/80 mb-4">Start your application process today</p>
                <Button
                //  onClick={() => router.push(`/university/${slug}/apply/${program.slug}`)}
                disabled
                  className="w-full bg-white text-[#002147] hover:bg-gray-100"
                >
                  Start Application
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* University Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-[#002147]">
                  <Building2 className="h-5 w-5 mr-2" />
                  University Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="font-medium text-[#002147]">{university.name}</div>
                  <div className="text-sm text-gray-600">
                    {university.city}{university.state ? `, ${university.state}` : ''}, {university.country}
                  </div>
                </div>
                
                {department && (
                  <div>
                    <div className="text-sm text-gray-500">Department</div>
                    <div className="font-medium text-gray-800">{department.name}</div>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/dashboard/university/${slug}`)}
                  className="w-full"
                >
                  View University Profile
                </Button>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-[#002147]">
                  <Users className="h-5 w-5 mr-2" />
                  Need Help?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Have questions about this program? Get in touch with the admissions office.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                 // onClick={() => router.push(`/university/${slug}/contact`)}
                  className="w-full"
                >
                  Contact Admissions
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Related Programs */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#002147]">Other Programs in {department?.name || 'This University'}</h2>
           
          </div>
          
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Related programs will be displayed here</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push(`/dashboard/university/${slug}/programs`)}
            >
              Browse All Programs
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProgramDetailsPage;