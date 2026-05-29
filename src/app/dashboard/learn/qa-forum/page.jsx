"use client";
// app/dashboard/learn/qa-forum/page.jsx
import { useState } from "react";
import { HelpCircle, Plus, CheckCircle } from "lucide-react";
import { forumQuestions, forumCategories } from "@/lib/learnData";

export default function QAForumPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [sort, setSort] = useState("Most upvoted");

  const filtered =
    activeCategory === "All"
      ? forumQuestions
      : forumQuestions.filter((q) => q.category === activeCategory);

  const sorted = [...filtered].sort((a, b) =>
    sort === "Most upvoted" ? b.upvotes - a.upvotes : 0
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#002147]/10 rounded-xl">
            <HelpCircle className="w-5 h-5 text-[#002147]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#002147] font-roboto tracking-[0.4px]">
              Q&amp;A Forum
            </h1>
            <p className="text-sm text-gray-500 font-roboto">
              Peer-to-peer questions. Alumni mentors earn position through upvotes, not promotion.
            </p>
          </div>
        </div>
        <button className="
          flex items-center gap-2 bg-[#002147] text-white
          text-sm font-medium px-4 py-2.5 rounded-xl font-roboto
          hover:bg-[#001530] transition-colors shadow-sm shrink-0
        ">
          <Plus className="w-4 h-4" />
          Ask a question
        </button>
      </div>

      <div className="h-6" />

      {/* Filters */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex gap-2 flex-wrap">
          {["All", ...forumCategories].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat | ForumCategory)}
              className={`
                text-xs font-medium px-3 py-1.5 rounded-full border
                font-roboto tracking-[0.3px] transition-all duration-200
                ${activeCategory === cat
                  ? "bg-[#002147] border-[#002147] text-white"
                  : "bg-white border-gray-200 text-[#002147] hover:border-[#3598FE]/50 hover:bg-[#F0F4FA]"
                }
              `}
            >
              {cat}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="
            text-xs border border-gray-200 rounded-xl px-3 py-1.5
            text-[#002147] bg-white font-roboto shrink-0
            focus:outline-none focus:ring-2 focus:ring-[#3598FE]/30
          "
        >
          <option>Most upvoted</option>
          <option>Most recent</option>
        </select>
      </div>

      {/* Questions */}
      <div className="space-y-3">
        {sorted.map((q) => (
          <div
            key={q.id}
            className="
              rounded-xl border border-gray-200/70 bg-white px-5 py-4
              flex gap-5 cursor-pointer
              hover:shadow-sm hover:border-[#3598FE]/30
              transition-all duration-200
            "
          >
            {/* Upvote column */}
            <div className="shrink-0 flex flex-col items-center pt-0.5 w-12">
              <span className="text-lg font-bold text-[#002147] font-roboto leading-none">
                {q.upvotes}
              </span>
              <span className="text-[9px] text-gray-400 font-roboto">upvotes</span>
              {q.isAlumniAnswered && (
                <div className="mt-2 flex flex-col items-center gap-0.5">
                  <span className="text-xs font-bold text-green-600 font-roboto leading-none">
                    {q.answers}
                  </span>
                  <span className="flex items-center gap-0.5 text-[9px] text-green-600 font-roboto">
                    <CheckCircle className="w-2.5 h-2.5" />
                    answered
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#002147] text-sm mb-1 font-roboto">{q.title}</p>
              <p className="text-xs text-gray-500 line-clamp-1 mb-2 font-roboto">{q.body}</p>

              {q.topAnswerer && (
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                  <span className="text-xs font-medium text-[#002147] font-roboto">{q.topAnswerer}</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full font-roboto">
                    🎓 {q.topAnswererSchool}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-roboto">
                  {q.category}
                </span>
                {q.schoolTag && (
                  <span className="text-xs font-semibold bg-[#002147] text-white px-2 py-0.5 rounded-full font-roboto">
                    {q.schoolTag}
                  </span>
                )}
                <span className="text-xs text-gray-300 ml-auto font-roboto">{q.postedAt}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}