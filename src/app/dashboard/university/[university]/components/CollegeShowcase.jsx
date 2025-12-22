import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, ChevronRight, MapPin, Star, Users, 
  BookOpen, Building2, GraduationCap, Globe, FileText,
  ExternalLink, Target, TrendingUp
} from 'lucide-react';

const CollegeShowcase = ({ university }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const isValidValue = (val) => {
    if (val === null || val === undefined) return false;
    if (val === '' || val === 'N/A' || val === 'n/a') return false;
    if (typeof val === 'number' && val === 0) return false;
    if (typeof val === 'string' && val.trim() === '') return false;
    return true;
  };

  const getImages = () => {
    if (!university.images) return [];
    if (university.images.length > 0 && typeof university.images[0] === 'object' && university.images[0].url) {
      return university.images.map(img => ({
        url: img.url,
        alt: img.alt || img.imageAltText || university.name,
        caption: img.caption || img.imageCaption
      }));
    }
    if (university.images.length > 0 && typeof university.images[0] === 'string') {
      return university.images.map(url => ({ url, alt: university.name, caption: null }));
    }
    return [];
  };

  const images = getImages();
  
  const getFallbackImage = () => {
    if (university.primaryImage) return university.primaryImage;
    if (university.image) return university.image;
    return "/default-university.jpg";
  };

  const handlePrevImage = () => setCurrentImageIndex((prev) => prev === 0 ? images.length - 1 : prev - 1);
  const handleNextImage = () => setCurrentImageIndex((prev) => prev === images.length - 1 ? 0 : prev + 1);

  const buildValidStats = () => {
    const validStats = [];
    if (isValidValue(university.stats?.acceptance)) {
      validStats.push({ value: university.stats.acceptance, label: "Acceptance Rate" });
    }
    if (isValidValue(university.stats?.avgGmat)) {
      validStats.push({ value: university.stats.avgGmat, label: "Avg GMAT" });
    }
    if (isValidValue(university.stats?.students)) {
      validStats.push({ value: university.stats.students, label: "Students" });
    }
    if (isValidValue(university.averageProgramLengthMonths)) {
      validStats.push({ value: `${university.averageProgramLengthMonths}m`, label: "Duration" });
    }
    return validStats;
  };

  const validStats = buildValidStats();
  const hasPrograms = university.programs && university.programs.length > 0;

  return (
    <div className="max-w-7xl mx-auto my-8">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6 lg:p-8">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#002147] mb-3">
              {university.name || university.universityName}
            </h1>
            <div className="flex flex-wrap items-center gap-5">
              <div className="flex items-center text-gray-600">
                <MapPin className="h-4 w-4 text-[#3598FE] mr-2" />
                <span className="text-sm">{university.fullAddress || university.location}</span>
              </div>
              {university.websiteUrl && (
                <a 
                  href={university.websiteUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-[#3598FE] hover:underline"
                >
                  <Globe className="h-4 w-4 mr-1.5" />
                  Official Website
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              )}
              {university.brochureUrl && (
                <a 
                  href={university.brochureUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-[#3598FE] hover:underline"
                >
                  <FileText className="h-4 w-4 mr-1.5" />
                  Download Brochure
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              )}
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-xl shadow-md">
                {images.length > 0 ? (
                  <img 
                    src={images[currentImageIndex].url} 
                    alt={images[currentImageIndex].alt}
                    className="w-full h-72 md:h-80 object-cover"
                  />
                ) : (
                  <img 
                    src={getFallbackImage()} 
                    alt={university.name || university.universityName}
                    className="w-full h-72 md:h-80 object-cover"
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

                {/* Overlay Content */}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {university.name || university.universityName}
                  </h3>
                  <div className="flex items-center text-white/90 text-sm mb-3">
                    <MapPin className="h-3.5 w-3.5 mr-1.5" />
                    {university.city}, {university.country}
                  </div>
                  <div className="flex items-center gap-3">
                    {isValidValue(university.rating) && (
                      <div className="flex items-center bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                        <Star className="h-3.5 w-3.5 text-yellow-400 mr-1.5 fill-yellow-400" />
                        <span className="text-sm font-medium text-white">{university.rating}</span>
                      </div>
                    )}
                    {isValidValue(university.stats?.students) && (
                      <div className="flex items-center bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                        <Users className="h-3.5 w-3.5 text-white mr-1.5" />
                        <span className="text-sm font-medium text-white">{university.stats.students}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Navigation */}
                {images.length > 1 && (
                  <>
                    <div className="absolute top-4 right-4 bg-white/95 px-3 py-1.5 rounded-lg shadow">
                      <span className="text-xs font-semibold text-[#002147]">
                        {currentImageIndex + 1} / {images.length}
                      </span>
                    </div>
                    <button
                      onClick={handlePrevImage}
                      className="absolute top-1/2 left-3 -translate-y-1/2 w-9 h-9 bg-white/95 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5 text-[#002147]" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute top-1/2 right-3 -translate-y-1/2 w-9 h-9 bg-white/95 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-colors"
                    >
                      <ChevronRight className="h-5 w-5 text-[#002147]" />
                    </button>
                  </>
                )}
              </div>

              {/* Dots */}
              {images.length > 1 && (
                <div className="flex gap-2 justify-center">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`h-2 rounded-full transition-all ${
                        idx === currentImageIndex ? 'bg-[#002147] w-6' : 'bg-gray-300 w-2 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              )}

              {images.length > 0 && images[currentImageIndex].caption && (
                <p className="text-xs text-gray-500 text-center italic">{images[currentImageIndex].caption}</p>
              )}
            </div>

            {/* Info Section */}
            <div className="space-y-5">
              {isValidValue(university.shortDescription || university.description) && (
                <p className="text-base text-gray-700 leading-relaxed">
                  {university.shortDescription || university.description}
                </p>
              )}

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                <h4 className="text-sm font-semibold text-[#002147] mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#3598FE]/10 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-[#3598FE]" />
                  </div>
                  About the University
                </h4>
                
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  {university.overview || university.biography || 
                   "This institution has been at the forefront of higher education, combining academic excellence with innovative research."}
                </p>

                {isValidValue(university.missionStatement) && (
                  <div className="bg-white border-l-3 border-[#3598FE] rounded-lg p-4 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-[#3598FE]" />
                      <span className="text-xs font-semibold text-[#002147] uppercase">Mission</span>
                    </div>
                    <p className="text-sm text-gray-600 italic leading-relaxed">{university.missionStatement}</p>
                  </div>
                )}

                {isValidValue(university.visionStatement) && (
                  <div className="bg-white border-l-3 border-[#002147] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-[#002147]" />
                      <span className="text-xs font-semibold text-[#002147] uppercase">Vision</span>
                    </div>
                    <p className="text-sm text-gray-600 italic leading-relaxed">{university.visionStatement}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Lower Section */}
          <div className="space-y-8">
            
            {/* Academic Excellence CTA */}
            <div className="bg-[#002147] rounded-xl p-6">
              <div className="text-center mb-5">
                <h4 className="text-lg font-semibold text-white mb-2">Explore Academic Excellence</h4>
                <p className="text-sm text-blue-200">Discover departments and programs designed to shape future leaders</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <button 
                  onClick={() => window.location.href = `/dashboard/university/${university.slug}/departments`}
                  className="bg-[#3598FE] hover:bg-[#2080e8] text-white p-4 rounded-lg transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold">Academic Departments</div>
                      <div className="text-xs text-white/80">Explore all faculties</div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
                
                <button 
                  onClick={() => window.location.href = `/dashboard/university/${university.slug}/programs`}
                  className="bg-white hover:bg-gray-50 text-[#002147] p-4 rounded-lg transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#3598FE]/10 rounded-lg flex items-center justify-center">
                      <GraduationCap className="h-5 w-5 text-[#3598FE]" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold">Study Programs</div>
                      <div className="text-xs text-gray-500">View all degrees</div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-[#3598FE] group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Programs and Statistics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Programs */}
              {hasPrograms && (
                <div className="lg:col-span-2 bg-gray-50 border border-gray-200 rounded-xl p-5">
                  <h4 className="text-sm font-semibold text-[#002147] mb-4 flex items-center gap-2">
                    <div className="w-7 h-7 bg-[#3598FE]/10 rounded-lg flex items-center justify-center">
                      <GraduationCap className="h-4 w-4 text-[#3598FE]" />
                    </div>
                    Programs Offered
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {university.programs.slice(0, 12).map((program, index) => (
                      <span 
                        key={index} 
                        className="px-3 py-2 bg-white text-[#002147] rounded-lg text-sm font-medium border border-gray-200 hover:border-[#3598FE] hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        {typeof program === 'object' ? program.name || program.programName : program}
                      </span>
                    ))}
                    {university.programs.length > 12 && (
                      <button
                        onClick={() => window.location.href = `/dashboard/university/${university.slug}/programs`}
                        className="px-3 py-2 bg-[#002147] text-white rounded-lg text-sm font-medium hover:bg-[#003366] transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        +{university.programs.length - 12} more
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Statistics */}
              {validStats.length > 0 && (
                <div className={hasPrograms ? '' : 'lg:col-span-3'}>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 h-full">
                    <h4 className="text-sm font-semibold text-[#002147] mb-4 flex items-center gap-2">
                      <div className="w-7 h-7 bg-[#002147] rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-white" />
                      </div>
                      Key Statistics
                    </h4>
                    <div className={`grid gap-3 ${hasPrograms ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
                      {validStats.map((stat, index) => (
                        <div 
                          key={index} 
                          className={`text-center p-4 rounded-lg ${index % 2 === 0 ? 'bg-[#002147]' : 'bg-[#3598FE]'}`}
                        >
                          <div className="text-xl font-bold text-white mb-1">{stat.value}</div>
                          <div className="text-xs text-white/80 font-medium">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default CollegeShowcase;