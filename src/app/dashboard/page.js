"use client"

import React, { useState } from 'react';
import { StatsOverview } from './components/StatsOverview';
import { UniversityCard } from './components/UniversityCard';
import { AddUniversityModal } from './components/AddUniversityModal';
import { FloatingAddButton } from './components/FloatingAddButton';

const mockUniversities = [
  {
    id: 1,
    name: "Harvard Business School",
    location: "Boston, MA",
    image: "https://images.unsplash.com/photo-1493397212122-2b85dda8106b?w=800&h=600&fit=crop",
    deadline: "January 15, 2024",
    essayProgress: 75,
    tasks: 8,
    totalTasks: 12,
    gmatAverage: 730,
    status: "in-progress" 
  },
  {
    id: 2,
    name: "Stanford Graduate School",
    location: "Stanford, CA",
    image: "https://images.unsplash.com/photo-1466442929976-97f336a657be?w=800&h=600&fit=crop",
    deadline: "February 1, 2024",
    essayProgress: 45,
    tasks: 3,
    totalTasks: 10,
    gmatAverage: 740,
    status: "not-started" 
  },
  {
    id: 3,
    name: "MIT Sloan School",
    location: "Cambridge, MA",
    image: "https://images.unsplash.com/photo-1492321936769-b49830bc1d1e?w=800&h=600&fit=crop",
    deadline: "January 30, 2024",
    essayProgress: 100,
    tasks: 12,
    totalTasks: 12,
    gmatAverage: 720,
    status: "submitted" 
  }
];

const Index = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [universities, setUniversities] = useState(mockUniversities);

  const handleRemoveUniversity = (id) => {
    setUniversities(universities.filter(u => u.id !== id));
  };

  const stats = {
    total: universities.length,
    inProgress: universities.filter(u => u.status === 'in-progress').length,
    submitted: universities.filter(u => u.status === 'submitted').length,
    upcomingDeadlines: universities.filter(u => u.status !== 'submitted').length
  };

  return (
    <div className="min-h-screen ">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-center text-[44px] -mt-10">
            University Applications
          </h1>
          <p className="text-center">
            Track your application progress and manage deadlines
          </p>
        </div>

        {/* Stats Overview */}
        <StatsOverview stats={stats} />

        {/* Universities Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {universities.map((university) => (
            <UniversityCard 
              key={university.id} 
              university={university} 
              onRemove={handleRemoveUniversity}
            />
          ))}
        </div>

        {/* Floating Add Button */}
        <FloatingAddButton onClick={() => setIsModalOpen(true)} />

        {/* Add University Modal */}
        <AddUniversityModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          onAdd={(newUniversity) => {
            setUniversities([...universities, { ...newUniversity, id: Date.now() }]);
            setIsModalOpen(false);
          }}
        />
      </div>
    </div>
  );
};

export default Index;
