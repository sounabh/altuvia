'use client';

import React, { useState } from 'react';
import { StatsOverview } from './components/StatsOverview';
import { UniversityCard } from './components/UniversityCard';
import { AddUniversityModal } from './components/AddUniversityModal';
import { FloatingAddButton } from './components/FloatingAddButton';



// 🏫 Dummy data for initial universities
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

  // 🎯 Modal open/close state for "Add University" popup
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 🎓 All universities (initially from mock data)
  const [universities, setUniversities] = useState(mockUniversities);


  // ❌ Handle removing a university from the list by filtering out the clicked one
  const handleRemoveUniversity = (id) => {
    setUniversities(universities.filter(u => u.id !== id));
  };


  // 📊 Compute some overview statistics for the dashboard summary
  const stats = {
    total: universities.length, // total universities
    inProgress: universities.filter(u => u.status === 'in-progress').length, // active ones
    submitted: universities.filter(u => u.status === 'submitted').length, // submitted ones
    upcomingDeadlines: universities.filter(u => u.status !== 'submitted').length // anything not yet submitted
  };

  return (
    <div className="min-h-screen ">

      <div className=" px-4 py-8 max-w-7xl">

        {/* 🧭 Header Section */}
        <div className="mb-8">

          <h1 className="text-center text-[40px] tracking-[0.2px] -mt-10">
            University Applications
          </h1>

          <p className="text-center">
            Track your application progress and manage deadlines
          </p>
        </div>


        {/* 📊 Stats Overview (summary tiles like Total, In Progress, etc.) */}
        <StatsOverview stats={stats} />


        {/* 🏫 University Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 🖼️ Render each university as a card */}
          {universities.map((university) => (

            <UniversityCard 
              key={university.id} 
              university={university} 
              onRemove={handleRemoveUniversity} // pass remove function to card
            />
          ))}
        </div>


        {/* ➕ Floating Add Button to open modal */}
        <FloatingAddButton onClick={() => setIsModalOpen(true)} />


        {/* 🆕 Add University Modal (popup for adding a new one) */}
        <AddUniversityModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} // close modal
          
          // When user adds a new university
          onAdd={(newUniversity) => {
            // Add new university to list with a unique id
            setUniversities([...universities, { ...newUniversity, id: Date.now() }]);

            // Close modal after adding
            setIsModalOpen(false);
          }}
        />

      </div>

    </div>
  );
};

export default Index;
