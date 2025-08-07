"use client";

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, ChevronRight, MapPin, Star, Users, 
  Award, BookOpen, Bookmark, BookmarkCheck 
} from 'lucide-react';

const CollegeShowcase = ({ university, savedStatus, toggleSaved }) => {
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
    <div className="max-w-7xl mx-auto rounded-2xl my-12">
      <div className="p-0">
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#002147]">
                {university.name}
              </h1>
              <div className="flex items-center mt-2">
                <MapPin className="h-4 w-4 text-[#3598FE] mr-2" />
                <span className="text-gray-600">{university.location}</span>
              </div>
            </div>
            <Button 
              onClick={toggleSaved}
              className={`flex items-center ${
                savedStatus 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-[#002147] hover:bg-[#001a36]'
              } text-white hover:shadow-lg transition-all duration-300`}
            >
              {savedStatus ? (
                <>
                  <BookmarkCheck className="h-4 w-4 mr-2" />
                  Saved
                </>
              ) : (
                <>
                  <Bookmark className="h-4 w-4 mr-2" />
                  Save University
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-8 pb-8">
            <div className="space-y-4">
              <div className="relative overflow-hidden shadow-2xl rounded-2xl">
                {university.images.length > 0 ? (
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

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>

                <div className="absolute bottom-6 left-6 text-white">
                  <h3 className="text-2xl md:text-3xl font-bold mb-2 leading-tight">{university.name}</h3>
                  <div className="flex items-center text-sm opacity-90 mb-3">
                    <MapPin className="h-4 w-4 mr-2" />
                    {university.location}
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center bg-white/20 px-3 py-1 backdrop-blur-sm">
                      <Star className="h-3 w-3 text-yellow-400 mr-1" />
                      <span className="font-medium">{university.rating}</span>
                    </div>
                    <div className="flex items-center bg-white/20 px-3 py-1 backdrop-blur-sm">
                      <Users className="h-3 w-3 mr-1" />
                      <span className="font-medium">{university.stats.students}</span>
                    </div>
                  </div>
                </div>

                <div className="absolute top-6 right-6 bg-white/90 px-3 py-2 backdrop-blur-sm rounded-full">
                  <span className="text-xs font-semibold text-[#002147]">
                    {currentImageIndex + 1} / {university.images.length}
                  </span>
                </div>

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
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-gray-700 text-lg leading-relaxed font-medium mb-4">
                  {university.description}
                </p>

                <div className="bg-white p-6 border border-gray-100 shadow-sm rounded-2xl">
                  <h4 className="text-lg font-bold text-[#002147] mb-3 flex items-center">
                    <BookOpen className="h-5 w-5 mr-2 text-[#3598FE]" />
                    About
                  </h4>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    {university.biography}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-[#002147] shadow-sm hover:shadow-md transition-shadow rounded-xl">
                  <div className="text-2xl font-bold text-white mb-1">{university.stats.acceptance}</div>
                  <div className="text-xs text-white font-medium">Acceptance Rate</div>
                </div>
                <div className="text-center p-4 bg-[#002147] shadow-sm hover:shadow-md transition-shadow rounded-xl">
                  <div className="text-2xl font-bold text-white mb-1">{university.stats.avgGmat}</div>
                  <div className="text-xs text-white font-medium">Avg GMAT</div>
                </div>
                <div className="text-center p-4 bg-[#002147] shadow-sm hover:shadow-md transition-shadow rounded-xl">
                  <div className="text-2xl font-bold text-white mb-1">{university.stats.students}</div>
                  <div className="text-xs text-white font-medium">Students</div>
                </div>
              </div>

              <div className="bg-white p-6 border border-gray-100 shadow-sm rounded-2xl">
                <h4 className="text-lg font-bold text-[#002147] mb-4 flex items-center">
                  <Award className="h-5 w-5 mr-2 text-[#3598FE]" />
                  Programs Offered
                </h4>
                <div className="flex flex-wrap gap-2">
                  {university.programs.map((program, index) => (
                    <span 
                      key={index} 
                      className="px-3 py-1 bg-[#002147]/10 text-[#002147] rounded-full text-sm font-medium"
                    >
                      {program}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollegeShowcase;