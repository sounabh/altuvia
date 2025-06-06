"use client"

import React, { useState, useMemo } from 'react';
import { SearchFilters } from '../search/components/SearchFilters';
import { UniversityCard } from '../search/components/UniversityCard';
//import { universityData } from '../data/universities';


export const universityData = [
  {
    id: 1,
    name: "Harvard University",
    location: "Cambridge, MA, USA",
    rank: 1,
    gmatAvg: 730,
    acceptanceRate: 12,
    image: "https://tse1.mm.bing.net/th?id=OIP._HlEZKdFGMvqxhvNTgL7bwHaDt&pid=Api&P=0&h=180",
    description: "A prestigious Ivy League university known for business, law, and leadership programs.",
    color: "#D1E3FF", // Soft blue but more visible
    pros: ["Elite faculty", "Global reputation", "Alumni network"],
    cons: ["Highly competitive", "High tuition"]
  },
  {
    id: 2,
    name: "Stanford University",
    location: "Stanford, CA, USA",
    rank: 2,
    gmatAvg: 735,
    acceptanceRate: 10,
    image: "https://tse4.mm.bing.net/th?id=OIP.ONB9zqX2nyaej6Y3aSyY6AHaDW&pid=Api&P=0&h=180",
    description: "Top-ranked West Coast university known for tech innovation and strong MBA programs.",
    color: "#FFE1D2", // Warm peach tone
    pros: ["Tech ecosystem", "Innovative curriculum", "Sunny campus"],
    cons: ["Costly living", "Tough admission"]
  },
  {
    id: 3,
    name: "INSEAD",
    location: "Fontainebleau, France",
    rank: 6,
    gmatAvg: 710,
    acceptanceRate: 25,
    image: "https://tse4.mm.bing.net/th?id=OIP.T_SzFaYB3pEDuIZcztmFeQHaDL&pid=Api&P=0&h=180",
    description: "International business school with campuses in France, Singapore, and UAE.",
    color: "#DCF2EA", // Soft green mint
    pros: ["Global exposure", "1-year MBA", "Multiple campuses"],
    cons: ["Intensive schedule", "Limited electives"]
  },
  {
    id: 4,
    name: "London Business School",
    location: "London, UK",
    rank: 8,
    gmatAvg: 705,
    acceptanceRate: 20,
    image: "https://tse1.mm.bing.net/th?id=OIP.c_zPmUyHS1L9E1GljD2MWAHaE8&pid=Api&P=0&h=180",
    description: "Renowned for finance and global business studies, based in the heart of London.",
    color: "#F5E4FF", // Soft purple lavender
    pros: ["Finance-focused", "London access", "Diverse cohort"],
    cons: ["Expensive city", "Competitive"]
  },
  {
    id: 5,
    name: "University of Chicago (Booth)",
    location: "Chicago, IL, USA",
    rank: 10,
    gmatAvg: 720,
    acceptanceRate: 22,
    image: "https://tse2.mm.bing.net/th?id=OIP.LIjOK0qIXA9R1NFKavQSowHaE9&pid=Api&P=0&h=180",
    description: "Known for its analytical approach and rigorous curriculum in business education.",
    color: "#FFECD5", // Warm beige orange
    pros: ["Quant-heavy", "Strong faculty", "Rigorous program"],
    cons: ["Demanding academics", "Weather"]
  }
];



const Index = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRankFilter, setSelectedRankFilter] = useState('all');
  const [selectedGmatFilter, setSelectedGmatFilter] = useState('all');
  const [dashboardItems, setDashboardItems] = useState([]);

  const filteredUniversities = useMemo(() => {
    return universityData.filter((university) => {
      const matchesSearch = university.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          university.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRank = selectedRankFilter === 'all' || 
                         (selectedRankFilter === 'top10' && university.rank <= 10) ||
                         (selectedRankFilter === 'top20' && university.rank <= 20);
      
      const matchesGmat = selectedGmatFilter === 'all' ||
                         (selectedGmatFilter === 'high' && university.gmatAvg >= 700) ||
                         (selectedGmatFilter === 'medium' && university.gmatAvg >= 600 && university.gmatAvg < 700);
      
      return matchesSearch && matchesRank && matchesGmat;
    });
  }, [searchTerm, selectedRankFilter, selectedGmatFilter]);

  const addToDashboard = (universityId) => {
    if (!dashboardItems.includes(universityId)) {
      setDashboardItems([...dashboardItems, universityId]);
    }
  };

  const removeFromDashboard = (universityId) => {
    setDashboardItems(dashboardItems.filter(id => id !== universityId));
  };


  return (
    <div className="min-h-screen ">
      {/* Header */}
      <div className="bg-white backdrop-blur-sm border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="">
              University Explorer
            </h1>
            <p className="">
              Discover and compare top schools worldwide with modern insights
            </p>
          </div>
        </div>
      </div>




      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <SearchFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedRankFilter={selectedRankFilter}
          onRankFilterChange={setSelectedRankFilter}
          selectedGmatFilter={selectedGmatFilter}
          onGmatFilterChange={setSelectedGmatFilter}
        />

        {/* Results Count */}
        <div className="mb-8">
          <p className="text-slate-600 font-medium">
            {filteredUniversities.length} of {universityData.length} universities
          </p>
        </div>

        {/* University Grid - More compact */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredUniversities.map((university) => (
            <UniversityCard
              key={university.id}
              university={university}
              isInDashboard={dashboardItems.includes(university.id)}
              onAddToDashboard={() => addToDashboard(university.id)}
              onRemoveFromDashboard={() => removeFromDashboard(university.id)}
            />
          ))}
        </div>

        {filteredUniversities.length === 0 && (
          <div className="text-center py-20">
            <div className="text-slate-400 text-6xl mb-4">🔍</div>
            <p className="text-slate-500 text-lg font-medium">
              No universities found matching your criteria
            </p>
            <p className="text-slate-400 text-sm mt-2">
              Try adjusting your filters to see more results
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
