"use client";
// app/dashboard/learn/school-compare/page.jsx
import { useState } from "react";
import { BarChart2 } from "lucide-react";
import { schools, compareDimensions } from "@/lib/learnData";

const MAX_COMPARE = 4;

export default function SchoolComparePage() {
  const [selected, setSelected] = useState(["wharton", "insead"]);

  const toggle = (slug) => {
    setSelected((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : prev.length < MAX_COMPARE
        ? [...prev, slug]
        : prev
    );
  };

  const selectedSchools = schools.filter((s) => selected.includes(s.slug));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-[#002147]/10 rounded-xl">
          <BarChart2 className="w-5 h-5 text-[#002147]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#002147] font-roboto tracking-[0.4px]">
            School Compare
          </h1>
          <p className="text-sm text-gray-500 font-roboto">
            Side-by-side comparison. Pick 2–4 schools.
          </p>
        </div>
      </div>

      <div className="h-6" />

      {/* School chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        {schools.map((school) => {
          const isActive = selected.includes(school.slug);
          return (
            <button
              key={school.slug}
              onClick={() => toggle(school.slug)}
              className={`
                text-xs font-medium px-4 py-2 rounded-full border
                font-roboto tracking-[0.3px] transition-all duration-200
                ${isActive
                  ? "bg-[#002147] border-[#002147] text-white shadow-sm"
                  : "bg-white border-gray-200 text-[#002147] hover:border-[#3598FE]/60 hover:bg-[#F0F4FA]"
                }
              `}
            >
              {isActive && <span className="mr-1 text-[#3598FE]">✓</span>}
              {school.name.replace("The ", "")}
            </button>
          );
        })}
      </div>

      {/* Table */}
      {selectedSchools.length >= 2 ? (
        <div className="rounded-2xl border border-gray-200/70 bg-white overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-left text-[10px] font-semibold tracking-[1px] text-gray-400 uppercase w-44 font-roboto">
                  Dimension
                </th>
                {selectedSchools.map((school) => (
                  <th key={school.slug} className="px-6 py-4 text-left">
                    <p className="font-bold text-[#002147] text-sm font-roboto tracking-[0.3px]">
                      {school.name}
                    </p>
                    <p className="text-[10px] text-gray-400 font-normal mt-0.5 font-roboto tracking-wide">
                      UPDATED {school.updatedAt.toUpperCase()}
                    </p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compareDimensions.map((dim, i) => (
                <tr
                  key={dim.key}
                  className={i % 2 === 0 ? "bg-white" : "bg-blue-50/30"}
                >
                  <td className="px-6 py-3.5 text-xs font-medium text-gray-500 font-roboto">
                    {dim.label}
                  </td>
                  {selectedSchools.map((school) => (
                    <td
                      key={school.slug}
                      className="px-6 py-3.5 font-semibold text-[#002147] font-roboto text-sm"
                    >
                      {String(school[dim.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-blue-50/30 p-10 text-center">
          <p className="text-sm text-gray-400 font-roboto">Select at least 2 schools to compare</p>
        </div>
      )}
    </div>
  );
}