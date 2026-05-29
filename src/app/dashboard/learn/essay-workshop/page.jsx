// app/dashboard/learn/essay-workshop/page.jsx
import { Edit3, Play } from "lucide-react";
import { essaySections } from "@/lib/learnData";

const tagColors = {
  "6-PART MINI-COURSE": "bg-purple-100 text-purple-700",
  "TOOL · REFERENCE":   "bg-[#3598FE]/10 text-[#3598FE]",
  "INTERACTIVE TOOL":   "bg-teal-100 text-teal-700",
};

export default function EssayWorkshopPage() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-[#002147]/10 rounded-xl">
          <Edit3 className="w-5 h-5 text-[#002147]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#002147] font-roboto tracking-[0.4px]">
            Essay Workshop
          </h1>
          <p className="text-sm text-gray-500 font-roboto">
            Craft your essays as a skill — fundamentals, prompt decoder, and a writing timeline planner.{" "}
            Distinct from <strong className="text-[#002147]">Essays</strong> (your actual drafts) in the main nav.
          </p>
        </div>
      </div>

      <div className="h-6" />

      <div className="space-y-4">
        {essaySections.map((section) => (
          <div
            key={section.title}
            className="rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm"
          >
            {/* Tag row */}
            <div className="flex items-start justify-between mb-4">
              <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full tracking-wide font-roboto ${tagColors[section.tag] ?? "bg-gray-100 text-gray-500"}`}>
                {section.tag}
              </span>

              {section.type === "course" && (
                <button className="
                  flex items-center gap-1.5 bg-[#002147] text-white
                  text-xs font-medium px-4 py-2 rounded-xl font-roboto
                  hover:bg-[#001530] transition-colors shadow-sm
                ">
                  <Play className="w-3 h-3 fill-white" />
                  Start course
                </button>
              )}
              {section.type === "interactive" && (
                <button className="
                  text-xs font-medium border border-gray-200 px-4 py-2
                  rounded-xl hover:bg-[#F0F4FA] hover:border-[#3598FE]/40
                  transition-all font-roboto text-[#002147]
                ">
                  {section.ctaLabel}
                </button>
              )}
            </div>

            <h2 className="font-semibold text-[#002147] text-base mb-1 font-roboto tracking-[0.3px]">
              {section.title}
            </h2>
            <p className="text-sm text-gray-500 mb-5 font-roboto">{section.description}</p>

            {/* Lessons */}
            {section.lessons && (
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                {section.lessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    className="
                      w-full flex items-center gap-4 px-4 py-3
                      hover:bg-[#F0F4FA] transition-colors text-left group
                    "
                  >
                    <span className="
                      w-7 h-7 rounded-full border-2 border-gray-200
                      flex items-center justify-center text-xs font-semibold
                      text-gray-400 shrink-0 font-roboto
                      group-hover:border-[#3598FE] group-hover:text-[#3598FE]
                      transition-colors
                    ">
                      {lesson.id}
                    </span>
                    <span className="flex-1 text-sm text-[#002147] font-roboto">{lesson.title}</span>
                    <span className="text-xs text-gray-400 font-roboto">{lesson.durationMin} min</span>
                  </button>
                ))}
              </div>
            )}

            {/* Archetype grid */}
            {section.archetypes && (
              <div className="grid grid-cols-3 gap-3">
                {section.archetypes.map((arch) => (
                  <button
                    key={arch.id}
                    className="
                      rounded-xl border border-gray-200 px-4 py-3 text-left
                      hover:border-[#3598FE]/40 hover:bg-[#F0F4FA]
                      transition-all duration-200
                    "
                  >
                    <p className="font-semibold text-sm text-[#002147] font-roboto">{arch.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5 font-roboto">
                      {arch.pendingCount} of your pending essays
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}