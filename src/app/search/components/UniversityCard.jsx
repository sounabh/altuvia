"use client"
import React, { useState } from 'react';
import { MapPin } from 'lucide-react';

// University Card Component
const UniversityCard = ({ university }) => {
  const [isAdded, setIsAdded] = useState(university?.isAdded);

  // Toggle Add/Added state
  const toggleAdd = () => {
    setIsAdded(!isAdded);
  };

  return (
    <div className="group relative mt-14 bg-white rounded-3xl shadow-sm hover:shadow-2xl border border-slate-200/60 hover:border-slate-300/60 transition-all duration-500 overflow-hidden">

      {/* ---------- Image Section with Rank Badge and Add Button ---------- */}
      <div className="relative overflow-hidden">
        {/* University Image */}
        <div className="aspect-[4/3] bg-slate-100">
          <img 
            src={university?.image} 
            alt={university?.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        </div>

        {/* University Rank Badge */}
        <div className="absolute top-4 left-4 bg-slate-900/80 text-white text-sm font-bold px-3 py-1 rounded-full backdrop-blur-sm">
          {university?.rank}
        </div>

        {/* Add/Added Button */}
        <button
          onClick={toggleAdd}
          className={`absolute top-4 right-4 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 backdrop-blur-sm ${
            isAdded 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'bg-white/90 text-slate-700 hover:bg-white border border-slate-200'
          }`}
        >
          {isAdded ? 'Added' : 'Add'}
        </button>
      </div>

      {/* ---------- University Info Section ---------- */}
      <div className="p-6">
        {/* University Name & Location */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
            {university?.name}
          </h3>
          <div className="flex items-center text-slate-600 text-sm">
            <MapPin className="w-4 h-4 mr-1" />
            {university?.location}
          </div>
        </div>

        {/* GMAT & Acceptance Rate Stats */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* GMAT Average */}
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {university?.gmatAvg}
            </div>
            <div className="text-sm text-slate-600">GMAT Avg</div>
          </div>

          {/* Acceptance Rate */}
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {university?.acceptRate}%
            </div>
            <div className="text-sm text-slate-600">Accept Rate</div>
          </div>
        </div>

        {/* Tuition & Application Fees */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          {/* Tuition Fee */}
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">📅</span>
            <span className="text-slate-700 font-medium">{university?.tuitionFee}</span>
          </div>

          {/* Application Fee */}
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">💰</span>
            <span className="text-slate-700 font-medium">{university?.applicationFee}</span>
          </div>
        </div>

        {/* ---------- Pros and Cons Section ---------- */}
        <div className="space-y-3">
          {/* Pros List */}
          <div>
            <div className="flex items-center mb-2">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              <span className="text-sm font-medium text-slate-700">Advantages</span>
            </div>
            <ul className="space-y-1 ml-4">
              {university?.pros?.map((pro, index) => (
                <li key={index} className="text-sm text-slate-600 flex items-center">
                  <span className="w-1 h-1 bg-slate-400 rounded-full mr-2"></span>
                  {pro}
                </li>
              ))}
            </ul>
          </div>

          {/* Cons List */}
          <div>
            <div className="flex items-center mb-2">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
              <span className="text-sm font-medium text-slate-700">Considerations</span>
            </div>
            <ul className="space-y-1 ml-4">
              {university?.cons.map((con, index) => (
                <li key={index} className="text-sm text-slate-600 flex items-center">
                  <span className="w-1 h-1 bg-slate-400 rounded-full mr-2"></span>
                  {con}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ---------- Hover Effect Border Overlay ---------- */}
      <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-slate-900/5 group-hover:ring-blue-500/20 group-hover:ring-2 transition-all duration-300"></div>
    </div>
  );
};

export default UniversityCard;
