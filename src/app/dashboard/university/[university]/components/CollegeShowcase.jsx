"use client"

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MapPin, Star, Users, Award, BookOpen } from 'lucide-react';

const CollegeShowcase = () => {
  // State to keep track of which image is currently shown
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Dummy college data
  const college = {
    name: "Stanford Graduate School of Business",
    location: "Stanford, California",
    images: [
      "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&h=400&fit=crop",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&h=400&fit=crop",
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=400&fit=crop",
      "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=800&h=400&fit=crop"
    ],
    description: "Stanford Graduate School of Business stands as one of the world's premier business education institutions, renowned for fostering innovation and entrepreneurial thinking.",
    biography: "Founded in 1925, Stanford GSB has been at the forefront of business education for nearly a century. Located in the heart of Silicon Valley, the school has produced numerous tech leaders, entrepreneurs, and global executives. The school's unique approach combines rigorous academic excellence with practical application, emphasizing leadership development and social impact. With a student body of just over 800 MBA students, Stanford GSB maintains an intimate learning environment while providing access to world-class faculty and resources.",
    rating: 4.9,
    programs: ["MBA", "Executive MBA", "PhD"],
    stats: {
      students: "800+",
      acceptance: "6.1%",
      avgGmat: "738"
    }
  };

  // Go to the previous image (wraps around)
  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? college.images.length - 1 : prev - 1
    );
  };

  // Go to the next image (wraps around)
  const handleNextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === college.images.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <div className="max-w-7xl mx-auto rounded-2xl my-12">
      <div className="p-0">

        {/* ----------------- Top Heading Bar ------------------ */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-1 h-8 bg-[#002147] mr-4"></div>
              <h2 className="text-2xl font-bold text-[#002147] tracking-tight">
                Featured College
              </h2>
            </div>
          </div>
        </div>

        {/* ---------------- Main Content Grid ---------------- */}
        <div className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-8 pb-8">

            {/* ---------------- College Image Section ---------------- */}
            <div className="space-y-4">
              <div className="relative overflow-hidden shadow-2xl rounded-2xl">
                <img 
                  src={college.images[currentImageIndex]} 
                  alt={college.name}
                  className="w-full h-80 md:h-96 object-cover transition-transform duration-500 hover:scale-105"
                />

                {/* Overlay gradient for better text visibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>

                {/* Bottom-Left College Info on Image */}
                <div className="absolute bottom-6 left-6 text-white">
                  <h3 className="text-2xl md:text-3xl font-bold mb-2 leading-tight">{college.name}</h3>
                  <div className="flex items-center text-sm opacity-90 mb-3">
                    <MapPin className="h-4 w-4 mr-2" />
                    {college.location}
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center bg-white/20 px-3 py-1 backdrop-blur-sm">
                      <Star className="h-3 w-3 text-yellow-400 mr-1" />
                      <span className="font-medium">{college.rating}</span>
                    </div>
                    <div className="flex items-center bg-white/20 px-3 py-1 backdrop-blur-sm">
                      <Users className="h-3 w-3 mr-1" />
                      <span className="font-medium">{college.stats.students}</span>
                    </div>
                  </div>
                </div>

                {/* Top-Right Current Image Indicator */}
                <div className="absolute top-6 right-6 bg-white/90 px-3 py-2 backdrop-blur-sm rounded-full">
                  <span className="text-xs font-semibold text-[#002147]">
                    {currentImageIndex + 1} / {college.images.length}
                  </span>
                </div>

                {/* Image Navigation Buttons */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevImage}
                  className="absolute top-1/2 left-4 transform -translate-y-1/2 h-10 w-10 p-0 border-[#002147] text-[#002147] hover:bg-[#002147] hover:text-white transition-all duration-300 rounded-full"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextImage}
                  className="absolute top-1/2 right-4 transform -translate-y-1/2 h-10 w-10 p-0 border-[#002147] text-[#002147] hover:bg-[#002147] hover:text-white transition-all duration-300 rounded-full"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              {/* Thumbnails as Dot Indicators */}
              <div className="flex space-x-2 justify-center">
                {college.images.map((_, idx) => (
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
            </div>

            {/* ---------------- College Content Section ---------------- */}
            <div className="space-y-6">

              {/* Description & Biography */}
              <div>
                <p className="text-gray-700 text-lg leading-relaxed font-medium mb-4">
                  {college.description}
                </p>

                <div className="bg-white p-6 border border-gray-100 shadow-sm rounded-2xl">
                  <h4 className="text-lg font-bold text-[#002147] mb-3 flex items-center">
                    <BookOpen className="h-5 w-5 mr-2 text-[#3598FE]" />
                    About
                  </h4>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    {college.biography}
                  </p>
                </div>
              </div>

              {/* Stats Boxes */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-[#002147] shadow-sm hover:shadow-md transition-shadow rounded-xl">
                  <div className="text-2xl font-bold text-white mb-1">{college.stats.acceptance}</div>
                  <div className="text-xs text-white font-medium">Acceptance Rate</div>
                </div>
                <div className="text-center p-4 bg-[#002147] shadow-sm hover:shadow-md transition-shadow rounded-xl">
                  <div className="text-2xl font-bold text-white mb-1">{college.stats.avgGmat}</div>
                  <div className="text-xs text-white font-medium">Avg GMAT</div>
                </div>
                <div className="text-center p-4 bg-[#002147] shadow-sm hover:shadow-md transition-shadow rounded-xl">
                  <div className="text-2xl font-bold text-white mb-1">{college.stats.students}</div>
                  <div className="text-xs text-white font-medium">Students</div>
                </div>
              </div>

              {/* Programs Offered Tags */}
              <div className="space-y-3">
                <h4 className="text-lg font-bold text-[#002147] flex items-center">
                  <Award className="h-5 w-5 mr-2 text-[#3598FE]" />
                  Programs Offered
                </h4>
                <div className="flex flex-wrap gap-2">
                  {college.programs.map((program, idx) => (
                    <span 
                      key={idx}
                      className="px-4 py-2 bg-[#002147] text-white text-sm font-medium shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 rounded-full"
                    >
                      {program}
                    </span>
                  ))}
                </div>
              </div>

            </div>
            {/* ---------------- End of Content Section ---------------- */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollegeShowcase;
