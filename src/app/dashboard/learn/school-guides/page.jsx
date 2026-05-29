// app/dashboard/learn/school-guides/page.jsx
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { schools } from "@/lib/learnData";

export default function SchoolGuidesPage() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-[#002147]/10 rounded-xl">
          <BookOpen className="w-5 h-5 text-[#002147]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#002147] font-roboto tracking-[0.4px]">
            School Guides
          </h1>
          <p className="text-sm text-gray-500 font-roboto">
            Editorial deep-dives, maintained quarterly. Pulled into your applications via the universities you've saved.
          </p>
        </div>
      </div>

      <div className="h-6" />

      {/* Grid */}
      <div className="grid grid-cols-3 gap-4">
        {schools.map((school) => (
          <Link
            key={school.slug}
            href={`/dashboard/learn/school-guides/${school.slug}`}
            className="
              rounded-2xl border border-gray-200/70 bg-white p-5
              hover:shadow-md hover:border-[#3598FE]/30
              transition-all duration-300 group
            "
          >
            {/* Card header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-semibold text-[#002147] text-sm leading-snug font-roboto tracking-[0.3px]">
                  {school.name}
                </h2>
                <p className="text-[11px] text-gray-400 mt-0.5 font-roboto">
                  Updated {school.updatedAt}
                </p>
              </div>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full font-roboto ${
                  school.completeness >= 90
                    ? "bg-green-100 text-green-700"
                    : school.completeness >= 80
                    ? "bg-amber-100 text-amber-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {school.completeness}%
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-y-3 gap-x-2">
              {[
                { label: "ACCEPTANCE", value: school.acceptance },
                { label: "CLASS SIZE", value: String(school.classSize) },
                { label: "AVG GMAT", value: String(school.avgGmat) },
                { label: "AVG SALARY", value: school.avgSalary },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-[9px] font-semibold tracking-[1px] text-gray-400 uppercase font-roboto">
                    {s.label}
                  </p>
                  <p className="font-bold text-[#002147] text-sm font-roboto mt-0.5">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}