import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, ChevronRight, MapPin, Star, Users, 
  BookOpen, Building2, GraduationCap, Globe, FileText,
  ExternalLink, Target, TrendingUp
} from 'lucide-react';

const CollegeShowcase = ({ university }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? university.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === university.images.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <div className="max-w-7xl mx-auto rounded-2xl my-8">
      <div className="p-6">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#002147] mb-4">
            {university.name}
          </h1>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 text-[#3598FE] mr-2" />
              <span className="text-gray-600">{university.fullAddress || university.location}</span>
            </div>
            {university.websiteUrl && (
              <a 
                href={university.websiteUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center text-[#3598FE] hover:text-[#002147] transition-colors"
              >
                <Globe className="h-4 w-4 mr-1" />
                <span className="text-sm">Official Website</span>
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            )}
            {university.brochureUrl && (
              <a 
                href={university.brochureUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center text-[#3598FE] hover:text-[#002147] transition-colors"
              >
                <FileText className="h-4 w-4 mr-1" />
                <span className="text-sm">Download Brochure</span>
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            )}
          </div>
        </div>

        {/* Upper Section - Images and Basic Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="relative overflow-hidden shadow-xl rounded-2xl">
              {university.images && university.images.length > 0 ? (
                <img 
                  src={university.images[currentImageIndex]} 
                  alt={university.name}
                  className="w-full h-80 md:h-96 object-cover transition-transform duration-500 hover:scale-105"
                />
              ) : (
                <div className="w-full h-80 md:h-96 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">No image available</span>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

              <div className="absolute bottom-6 left-6 text-white">
                <h3 className="text-2xl md:text-3xl font-bold mb-2 leading-tight">{university.name}</h3>
                <div className="flex items-center text-sm opacity-90 mb-3">
                  <MapPin className="h-4 w-4 mr-2" />
                  {university.city}, {university.country}
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  {university.rating && (
                    <div className="flex items-center bg-white/20 px-3 py-1 backdrop-blur-sm rounded-full">
                      <Star className="h-3 w-3 text-yellow-400 mr-1" />
                      <span className="font-medium">{university.rating}</span>
                    </div>
                  )}
                  {university.stats?.students !== "N/A" && university.stats?.students && (
                    <div className="flex items-center bg-white/20 px-3 py-1 backdrop-blur-sm rounded-full">
                      <Users className="h-3 w-3 mr-1" />
                      <span className="font-medium">{university.stats.students}</span>
                    </div>
                  )}
                </div>
              </div>

              {university.images && university.images.length > 1 && (
                <>
                  <div className="absolute top-6 right-6 bg-white/90 px-3 py-2 backdrop-blur-sm rounded-full">
                    <span className="text-xs font-semibold text-[#002147]">
                      {currentImageIndex + 1} / {university.images.length}
                    </span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevImage}
                    className="absolute top-1/2 left-4 transform -translate-y-1/2 h-10 w-10 p-0 border-white/20 text-white hover:bg-white hover:text-[#002147] transition-all duration-300 rounded-full backdrop-blur-sm"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextImage}
                    className="absolute top-1/2 right-4 transform -translate-y-1/2 h-10 w-10 p-0 border-white/20 text-white hover:bg-white hover:text-[#002147] transition-all duration-300 rounded-full backdrop-blur-sm"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              )}
            </div>

            {university.images && university.images.length > 1 && (
              <div className="flex space-x-2 justify-center">
                {university.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      idx === currentImageIndex 
                        ? 'bg-[#002147] w-8' 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Basic Info Section */}
          <div className="space-y-6">
            <div>
              <p className="text-gray-700 text-lg leading-relaxed font-medium mb-6">
                {university.shortDescription || university.description}
              </p>

              {/* About Section */}
              <div className="bg-white p-6 border border-gray-100 shadow-sm rounded-2xl">
                <h4 className="text-xl font-bold text-[#002147] mb-4 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-[#3598FE]" />
                  About the University
                </h4>
                
                <div className="space-y-4 text-gray-600 leading-relaxed">
                  <p className="text-base">
                    {university.overview || university.biography || 
                     "This prestigious institution has been at the forefront of higher education, combining academic excellence with innovative research. Our commitment to fostering critical thinking, creativity, and leadership has made us a preferred destination for students worldwide."}
                  </p>

                  {university.missionStatement && (
                    <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-[#3598FE]">
                      <h5 className="font-semibold text-[#002147] mb-2 flex items-center">
                        <Target className="h-4 w-4 mr-2" />
                        Mission Statement
                      </h5>
                      <p className="text-sm text-gray-700 italic leading-relaxed">{university.missionStatement}</p>
                    </div>
                  )}

                  {university.visionStatement && (
                    <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-[#002147]">
                      <h5 className="font-semibold text-[#002147] mb-2 flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Vision Statement
                      </h5>
                      <p className="text-sm text-gray-700 italic leading-relaxed">{university.visionStatement}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lower Section - Full Width Academic Information */}
        <div className="space-y-8">
          {/* Explore Academic Options - Full Width */}
          <div className="bg-gradient-to-r from-[#002147] to-[#003366] p-8 rounded-2xl text-white">
            <h4 className="text-3xl font-bold mb-4 text-center">Explore Academic Excellence</h4>
            <p className="text-center text-blue-100 mb-8 text-lg max-w-3xl mx-auto">
              Discover our comprehensive range of departments and world-class programs designed to shape future leaders
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <Button 
                className="bg-[#3598FE] hover:bg-[#2485ed] text-white py-6 px-8 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-[1.02] flex items-center justify-center space-x-3 border-none text-lg h-auto"
                onClick={() => window.location.href = `/dashboard/university/${university.slug}/departments`}
              >
                <Building2 className="h-7 w-7" />
                <div className="text-left">
                  <div className="font-bold text-lg">Academic Departments</div>
                  <div className="text-sm opacity-90 font-normal">Explore our faculties</div>
                </div>
              </Button>
              
              <Button 
                className="bg-white hover:bg-gray-50 text-[#002147] py-6 px-8 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-[1.02] flex items-center justify-center space-x-3 border-none text-lg h-auto"
                onClick={() => window.location.href = `/university/${university.slug}/programs`}
              >
                <GraduationCap className="h-7 w-7" />
                <div className="text-left">
                  <div className="font-bold text-lg">Study Programs</div>
                  <div className="text-sm opacity-70 font-normal">View degree options</div>
                </div>
              </Button>
            </div>
          </div>

          {/* Programs and Statistics Section - Full Width */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Programs Offered - Takes 2/3 width on large screens */}
            {university.programs && university.programs.length > 0 && (
              <div className="lg:col-span-2 bg-white p-8 border border-gray-100 shadow-sm rounded-2xl">
                <h4 className="text-2xl font-bold text-[#002147] mb-6 text-center">Programs Offered</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {university.programs.slice(0, 12).map((program, index) => (
                    <div 
                      key={index} 
                      className="px-4 py-3 bg-[#3598FE]/10 text-[#002147] rounded-xl text-center font-medium hover:bg-[#3598FE] hover:text-white transition-colors cursor-pointer border border-[#3598FE]/20 hover:shadow-md"
                    >
                      <span className="text-sm leading-tight block">{program}</span>
                    </div>
                  ))}
                  {university.programs.length > 12 && (
                    <div className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl text-center font-medium border border-gray-200">
                      <span className="text-sm">+{university.programs.length - 12} more programs</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Key Statistics - Takes 1/3 width on large screens */}
            <div>
              <h4 className="text-2xl font-bold text-[#002147] mb-6 text-center">Key Statistics</h4>
              
              <div className="grid grid-cols-2 gap-3">
                {university.stats?.acceptance !== "N/A" && university.stats?.acceptance && (
                  <div className="text-center p-4 bg-[#002147] shadow-md hover:shadow-lg transition-shadow rounded-xl">
                    <div className="text-2xl font-bold text-white mb-1">{university.stats.acceptance}</div>
                    <div className="text-xs text-blue-200 font-medium">Acceptance Rate</div>
                  </div>
                )}
                
                {university.stats?.avgGmat !== "N/A" && university.stats?.avgGmat && (
                  <div className="text-center p-4 bg-[#3598FE] shadow-md hover:shadow-lg transition-shadow rounded-xl">
                    <div className="text-2xl font-bold text-white mb-1">{university.stats.avgGmat}</div>
                    <div className="text-xs text-blue-100 font-medium">Average GMAT</div>
                  </div>
                )}
                
                {university.stats?.students !== "N/A" && university.stats?.students && (
                  <div className="text-center p-4 bg-[#002147] shadow-md hover:shadow-lg transition-shadow rounded-xl">
                    <div className="text-2xl font-bold text-white mb-1">{university.stats.students}</div>
                    <div className="text-xs text-blue-200 font-medium">Total Students</div>
                  </div>
                )}
                
                {university.averageProgramLengthMonths && (
                  <div className="text-center p-4 bg-[#3598FE] shadow-md hover:shadow-lg transition-shadow rounded-xl">
                    <div className="text-2xl font-bold text-white mb-1">{university.averageProgramLengthMonths}m</div>
                    <div className="text-xs text-blue-100 font-medium">Program Length</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollegeShowcase;