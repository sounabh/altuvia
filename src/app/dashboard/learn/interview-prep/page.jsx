// app/dashboard/learn/interview-prep/page.jsx
import { Users, Play } from "lucide-react";
import { interviewCategories, topInterviewQuestions, interviewFormatGuides } from "@/lib/learnData";

export default function InterviewPrepPage() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-[#002147]/10 rounded-xl">
          <Users className="w-5 h-5 text-[#002147]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#002147] font-roboto tracking-[0.4px]">
            Interview Prep
          </h1>
          <p className="text-sm text-gray-500 font-roboto">
            180 questions across 8 categories. Practice timed answers in-browser.
          </p>
        </div>
      </div>

      <div className="h-6" />

      {/* Practice Mode banner */}
      <div className="rounded-2xl bg-[#002147] text-white px-6 py-5 flex items-center justify-between mb-8 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Play className="w-5 h-5 fill-white text-white" />
          </div>
          <div>
            <p className="font-semibold font-roboto">Practice Mode</p>
            <p className="text-gray-300 text-xs mt-0.5 font-roboto">
              Random question · timed · in-browser recording · optional AI feedback
            </p>
          </div>
        </div>
        <button className="
          flex items-center gap-2 bg-[#3598FE] hover:bg-[#2080e0]
          text-white text-sm font-medium px-5 py-2.5 rounded-xl
          transition-colors shadow-sm font-roboto shrink-0
        ">
          <Play className="w-3.5 h-3.5 fill-white" />
          Start practice
        </button>
      </div>

      {/* Categories */}
      <h2 className="font-bold text-[#002147] text-sm font-roboto tracking-[0.3px] mb-4">
        Browse by category
      </h2>
      <div className="grid grid-cols-4 gap-3 mb-8">
        {interviewCategories.map((cat) => (
          <button
            key={cat.id}
            className="
              rounded-xl border border-gray-200/70 bg-white p-4 text-left
              hover:shadow-sm hover:border-[#3598FE]/40 hover:bg-[#F0F4FA]
              transition-all duration-200
            "
          >
            <div
              className="w-2.5 h-2.5 rounded-full mb-3"
              style={{ backgroundColor: cat.color }}
            />
            <p className="font-semibold text-sm text-[#002147] font-roboto">{cat.label}</p>
            <p className="text-xs text-gray-400 mt-0.5 font-roboto">{cat.count} questions</p>
          </button>
        ))}
      </div>

      {/* Top questions */}
      <h2 className="font-bold text-[#002147] text-sm font-roboto tracking-[0.3px] mb-4">
        Top questions this week
      </h2>
      <div className="space-y-3 mb-8">
        {topInterviewQuestions.map((q) => (
          <div
            key={q.id}
            className="
              rounded-xl border border-gray-200/70 bg-white px-5 py-4
              flex items-center justify-between shadow-sm
            "
          >
            <div className="flex-1 min-w-0 mr-4">
              <p className="font-semibold text-sm text-[#002147] font-roboto">{q.question}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-roboto">
                  {q.category}
                </span>
                <span className="text-xs text-gray-400 font-roboto">Common at:</span>
                {q.commonAt.map((school) => (
                  <span
                    key={school}
                    className="text-xs font-semibold bg-[#002147] text-white px-2 py-0.5 rounded-full font-roboto"
                  >
                    {school}
                  </span>
                ))}
              </div>
            </div>
            <button className="
              flex items-center gap-1.5 shrink-0 text-xs font-medium
              border border-gray-200 px-3 py-1.5 rounded-xl font-roboto
              text-[#002147] hover:bg-[#F0F4FA] hover:border-[#3598FE]/40
              transition-all duration-200
            ">
              <Play className="w-3 h-3" />
              Practice
            </button>
          </div>
        ))}
      </div>

      {/* Format guides */}
      <h2 className="font-bold text-[#002147] text-sm font-roboto tracking-[0.3px] mb-4">
        Interview format guides
      </h2>
      <div className="grid grid-cols-2 gap-4">
        {interviewFormatGuides.map((guide) => (
          <div
            key={guide.id}
            className="
              rounded-xl border border-gray-200/70 bg-white p-5
              hover:shadow-sm hover:border-[#3598FE]/40
              transition-all duration-200 cursor-pointer
            "
          >
            <p className="font-semibold text-sm text-[#002147] mb-1 font-roboto">{guide.title}</p>
            <p className="text-xs text-gray-500 leading-relaxed font-roboto">{guide.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}