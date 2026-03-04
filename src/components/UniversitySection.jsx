/**
 * UniversitiesSection.jsx
 *
 * Extracted from Index.jsx so the page file is not bloated.
 * No logic changed — pure structural extraction + memo.
 */

import React, { memo } from 'react';
import Link from 'next/link';
import { Search, GraduationCap } from 'lucide-react';
import { UniversityCard } from '@/app/dashboard/components/UniversityCard';

export const UniversitiesSection = memo(({ universities, handleRemoveUniversity }) => (
  <>
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#002147]/10 rounded-xl" aria-hidden="true">
          <GraduationCap className="w-5 h-5 text-[#002147]" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#002147]">Saved Universities</h2>
          <p className="text-sm text-gray-500">{universities.length} universities in your list</p>
        </div>
      </div>
      <Link href="/dashboard/search" aria-label="Add more universities to your list">
        <button className="px-4 py-2 bg-white border border-gray-200 text-[#002147] rounded-xl text-sm font-medium hover:bg-gray-50 hover:border-[#3598FE] transition-all duration-300 flex items-center gap-2 shadow-sm gpu-accelerated">
          <Search className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">Add More</span>
        </button>
      </Link>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {universities.map((university, index) => (
        <UniversityCard
          key={university.id}
          university={university}
          index={index}
          onRemove={handleRemoveUniversity}
        />
      ))}
    </div>
  </>
));
UniversitiesSection.displayName = 'UniversitiesSection';