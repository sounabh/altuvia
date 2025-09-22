import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, ChevronRight, MapPin, Star, Users, 
  BookOpen, Building2, GraduationCap, Globe, FileText,
  ExternalLink, Target, TrendingUp
} from 'lucide-react';

/**
 * CollegeShowcase component - Comprehensive university profile display
 * Features image gallery, university information, academic programs, and statistics
 * 
 * @param {Object} props - Component props
 * @param {Object} props.university - University data object containing details, images, and statistics
 * @returns {JSX.Element} University showcase component with interactive elements
 */
const CollegeShowcase = ({ university }) => {
  // State for managing current image index in gallery
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  /**
   * Processes university images array to handle different data structures
   * Supports both old (string array) and new (object array) data formats
   * 
   * @returns {Array} Processed array of image objects with consistent structure
   */
  const getImages = () => {
    if (!university.images) return [];
    
    // Handle new structure: array of objects with url property
    if (university.images.length > 0 && typeof university.images[0] === 'object' && university.images[0].url) {
      return university.images.map(img => ({
        url: img.url,
        alt: img.alt || img.imageAltText || university.name,
        title: img.title || img.imageTitle,
        caption: img.caption || img.imageCaption,
        isPrimary: img.isPrimary
      }));
    }
    
    // Handle old structure: array of strings
    if (university.images.length > 0 && typeof university.images[0] === 'string') {
      return university.images.map(url => ({
        url,
        alt: university.name,
        title: university.name,
        caption: null,
        isPrimary: false
      }));
    }
    
    return [];
  };

  const images = getImages();
  
  /**
   * Provides fallback image URL when images array is empty
   * Prioritizes primaryImage, then image, then default image
   * 
   * @returns {string} URL for fallback image
   */
  const getFallbackImage = () => {
    if (university.primaryImage) return university.primaryImage;
    if (university.image) return university.image;
    return "/default-university.jpg";
  };

  /**
   * Navigates to previous image in gallery with circular looping
   */
  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  /**
   * Navigates to next image in gallery with circular looping
   */
  const handleNextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <div className="max-w-7xl mx-auto rounded-2xl my-8">
      <div className="p-6">
        {/* Header Section with University Name and Links */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#002147] mb-4">
            {university.name || university.universityName}
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

        {/* Upper Section - Images and Basic Info in Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Image Gallery Section */}
          <div className="space-y-4">
            <div className="relative overflow-hidden shadow-xl rounded-2xl">
              {images.length > 0 ? (
                <img 
                  src={images[currentImageIndex].url} 
                  alt={images[currentImageIndex].alt}
                  title={images[currentImageIndex].title}
                  className="w-full h-80 md:h-96 object-cover transition-transform duration-500 hover:scale-105"
                />
              ) : (
                <img 
                  src={getFallbackImage()} 
                  alt={university.imageAlt || university.name || university.universityName}
                  className="w-full h-80 md:h-96 object-cover transition-transform duration-500 hover:scale-105"
                />
              )}

              {/* Image Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

              {/* Image Overlay Content */}
              <div className="absolute bottom-6 left-6 text-white">
                <h3 className="text-2xl md:text-3xl font-bold mb-2 leading-tight">
                  {university.name || university.universityName}
                </h3>
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

              {/* Gallery Navigation Controls - Only show for multiple images */}
              {images.length > 1 && (
                <>
                  <div className="absolute top-6 right-6 bg-white/90 px-3 py-2 backdrop-blur-sm rounded-full">
                    <span className="text-xs font-semibold text-[#002147]">
                      {currentImageIndex + 1} / {images.length}
                    </span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevImage}
                    className="absolute top-1/2 left-4 transform -translate-y-1/2 h-10 w-10 p-0 border-white/20  hover:bg-white hover:text-[#002147] transition-all duration-300 rounded-full backdrop-blur-sm"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextImage}
                    className="absolute top-1/2 right-4 transform -translate-y-1/2 h-10 w-10 p-0 border-white/20  hover:bg-white hover:text-[#002147] transition-all duration-300 rounded-full backdrop-blur-sm"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              )}
            </div>

            {/* Image Pagination Dots - Only show for multiple images */}
            {images.length > 1 && (
              <div className="flex space-x-2 justify-center">
                {images.map((_, idx) => (
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

            {/* Image Caption Display */}
            {images.length > 0 && images[currentImageIndex].caption && (
              <p className="text-sm text-gray-600 text-center italic">
                {images[currentImageIndex].caption}
              </p>
            )}
          </div>

          {/* Basic Information Section */}
          <div className="space-y-6">
            <div>
              <p className="text-gray-700 text-lg leading-relaxed font-medium mb-6">
                {university.shortDescription || university.description}
              </p>

              {/* About University Section */}
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

                  {/* Mission Statement Highlight */}
                  {university.missionStatement && (
                    <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-[#3598FE]">
                      <h5 className="font-semibold text-[#002147] mb-2 flex items-center">
                        <Target className="h-4 w-4 mr-2" />
                        Mission Statement
                      </h5>
                      <p className="text-sm text-gray-700 italic leading-relaxed">{university.missionStatement}</p>
                    </div>
                  )}

                  {/* Vision Statement Highlight */}
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
          {/* Academic Excellence Call-to-Action Section */}
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
                onClick={() => window.location.href = `/dashboard/university/${university.slug}/programs`}
              >
                <GraduationCap className="h-7 w-7" />
                <div className="text-left">
                  <div className="font-bold text-lg">Study Programs</div>
                  <div className="text-sm opacity-70 font-normal">View degree options</div>
                </div>
              </Button>
            </div>
          </div>

          {/* Programs and Statistics Grid Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Programs Offered Section - 2/3 width on large screens */}
            {university.programs && university.programs.length > 0 && (
              <div className="lg:col-span-2 bg-white p-8 border border-gray-100 shadow-sm rounded-2xl">
                <h4 className="text-2xl font-bold text-[#002147] mb-6 text-center">Programs Offered</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {university.programs.slice(0, 12).map((program, index) => (
                    <div 
                      key={index} 
                      className="px-4 py-3 bg-[#3598FE]/10 text-[#002147] rounded-xl text-center font-medium hover:bg-[#3598FE] hover:text-white transition-colors cursor-pointer border border-[#3598FE]/20 hover:shadow-md"
                    >
                      <span className="text-sm leading-tight block">
                        {typeof program === 'object' ? program.name || program.programName : program}
                      </span>
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

            {/* Key Statistics Section - 1/3 width on large screens */}
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