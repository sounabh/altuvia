"use client";
// app/dashboard/learn/my-saved/page.jsx
import { useState } from "react";
import { Bookmark } from "lucide-react";
import { savedItems } from "@/lib/learnData";

const allTabs = [
  "All",
  "School Guides",
  "Essay Workshop",
  "Interview Questions",
  "Playbooks",
  "Q&A",
  "Comparisons",
];

const typeColors = {
  "School Guide":   "bg-[#3598FE]/10 text-[#3598FE]",
  "Essay Workshop": "bg-purple-100 text-purple-700",
  "Q&A":            "bg-teal-100 text-teal-700",
  "Comparison":     "bg-orange-100 text-orange-700",
};

// Map tab labels → SavedItemType values
const tabToType = {
  "All":                 null,
  "School Guides":       "School Guide",
  "Essay Workshop":      "Essay Workshop",
  "Interview Questions": null, // no items yet
  "Playbooks":           null,
  "Q&A":                 "Q&A",
  "Comparisons":         "Comparison",
};

export default function MySavedPage() {
  const [active, setActive] = useState("All");
  const [items, setItems] = useState(savedItems);

  const typeFilter = tabToType[active];
  const filtered = typeFilter === undefined || active === "All"
    ? items
    : items.filter((i) => i.type === typeFilter);

  const remove = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-[#002147]/10 rounded-xl">
          <Bookmark className="w-5 h-5 text-[#002147]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#002147] font-roboto tracking-[0.4px]">
            My Saved
          </h1>
          <p className="text-sm text-gray-500 font-roboto">
            Everything you've bookmarked across Learn.
          </p>
        </div>
      </div>

      <div className="h-6" />

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {allTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`
              text-xs font-medium px-3 py-1.5 rounded-full border
              font-roboto tracking-[0.3px] transition-all duration-200
              ${active === tab
                ? "bg-[#002147] border-[#002147] text-white"
                : "bg-white border-gray-200 text-[#002147] hover:border-[#3598FE]/50 hover:bg-[#F0F4FA]"
              }
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Items */}
      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="
                rounded-xl border border-gray-200/70 bg-white px-5 py-4
                flex items-center gap-3 shadow-sm
                hover:border-[#3598FE]/30 transition-colors
              "
            >
              <Bookmark
                className="w-4 h-4 text-amber-500 shrink-0"
                fill="currentColor"
              />
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 font-roboto ${typeColors[item.type]}`}>
                {item.type}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-[#002147] truncate font-roboto tracking-[0.3px]">
                  {item.title}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 font-roboto">{item.subtitle}</p>
              </div>
              <button
                onClick={() => remove(item.id)}
                className="
                  text-xs text-gray-400 hover:text-red-500
                  transition-colors shrink-0 font-roboto
                "
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-blue-50/30 p-10 text-center">
          <Bookmark className="w-6 h-6 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400 font-roboto">No saved items in this category yet</p>
        </div>
      )}
    </div>
  );
}