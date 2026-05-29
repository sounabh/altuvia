'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { Search, GraduationCap, Plus } from 'lucide-react';
import { UniversityCard } from '@/app/dashboard/components/UniversityCard';

// ─── Add card ─────────────────────────────────────────────────────────────────

const AddUniversityCard = memo(() => (
  <Link href="/dashboard/search" className="block">
    <div className="flex flex-col items-center justify-center h-[160px] rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#3598FE] hover:bg-[#3598FE]/5 transition-all duration-300 cursor-pointer group gap-2">
      <div className="w-9 h-9 rounded-full border-2 border-gray-200 group-hover:border-[#3598FE] group-hover:bg-[#3598FE]/10 flex items-center justify-center transition-all duration-300">
        <Plus className="w-4 h-4 text-gray-300 group-hover:text-[#3598FE] transition-colors duration-300" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-500 group-hover:text-[#002147] transition-colors duration-300">
          Add a university
        </p>
        <p className="text-xs text-gray-300 group-hover:text-gray-400 mt-0.5 transition-colors duration-300">
          Search 1,200+ programs
        </p>
      </div>
    </div>
  </Link>
));
AddUniversityCard.displayName = 'AddUniversityCard';

// ─── Main export ──────────────────────────────────────────────────────────────

export const UniversitiesSection = memo(({ universities, handleRemoveUniversity }) => (
  <>
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#002147]/10 rounded-xl" aria-hidden="true">
          <GraduationCap className="w-5 h-5 text-[#002147]" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#002147]">Saved Universities</h2>
          <p className="text-sm text-gray-500">
            {universities.length} {universities.length === 1 ? 'university' : 'universities'} in your list
          </p>
        </div>
      </div>
      <Link href="/dashboard/search" aria-label="Add more universities to your list">
        <button className="px-4 py-2 bg-white border border-gray-200 text-[#002147] rounded-xl text-sm font-medium hover:bg-gray-50 hover:border-[#3598FE] transition-all duration-300 flex items-center gap-2 shadow-sm">
          <Search className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">Add More</span>
        </button>
      </Link>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
      {universities.map((university, index) => (
        <UniversityCard
          key={university.id}
          university={university}
          index={index}
          onRemove={handleRemoveUniversity}
        />
      ))}
      <AddUniversityCard />
    </div>
  </>
));
UniversitiesSection.displayName = 'UniversitiesSection';