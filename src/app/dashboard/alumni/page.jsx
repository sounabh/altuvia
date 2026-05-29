"use client";

import React, { useState, useMemo, memo } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, GraduationCap, ArrowRight, Sparkles } from "lucide-react";


// ─── Data ─────────────────────────────────────────────────────────────────────
const ALUMNI = [
  {
    id: 1, name: "Priya Shah", initials: "PS", school: "Wharton", year: "'23",
    transition: "Consulting → Fintech PM", isCareerSwitcher: true,
    preMBA: "Management Consulting (McKinsey)", postMBA: "Fintech (Series C)",
    topics: ["Essays", "Career advice", "Interviews"],
    location: "New York, NY", linkedIn: "#", avatarColor: "#c7522a",
  },
  {
    id: 2, name: "Arjun Mehta", initials: "AM", school: "INSEAD", year: "'22",
    transition: "Bain Singapore → Growth VC", isCareerSwitcher: true,
    preMBA: "Bain & Company (Singapore)", postMBA: "Growth-stage VC",
    topics: ["Essays", "Career advice", "School culture"],
    location: "Singapore", linkedIn: "#", avatarColor: "#3b6ca8",
  },
  {
    id: 3, name: "Sara Okonkwo", initials: "SO", school: "LBS", year: "'24",
    transition: "Goldman → Climate Tech", isCareerSwitcher: true,
    preMBA: "Investment Banking (Goldman Sachs)", postMBA: "Climate Tech (Series B)",
    topics: ["Scholarships", "Career advice", "Essays"],
    location: "London, UK", linkedIn: "#", avatarColor: "#b07d3e",
  },
  {
    id: 4, name: "Daniel Park", initials: "DP", school: "MIT Sloan", year: "'23",
    transition: "Engineer → Founder", isCareerSwitcher: true,
    preMBA: "Tech (Cruise)", postMBA: "Stealth Startup",
    topics: ["Essays", "School culture"],
    location: "Cambridge, MA", linkedIn: "#", avatarColor: "#2d7d5c",
  },
  {
    id: 5, name: "Maya Rodriguez", initials: "MR", school: "HEC Paris", year: "'23",
    transition: "Nestlé → Brand Director", isCareerSwitcher: false,
    preMBA: "Consumer Goods (Nestlé)", postMBA: "Consumer Tech",
    topics: ["School culture", "Networking", "Essays"],
    location: "Paris, France", linkedIn: "#", avatarColor: "#7b4a8c",
  },
  {
    id: 6, name: "Tariq Hassan", initials: "TH", school: "Kellogg", year: "'22",
    transition: "PE → Operating Partner", isCareerSwitcher: false,
    preMBA: "Private Equity", postMBA: "PE / Buy-side",
    topics: ["Essays", "Interviews", "Career advice"],
    location: "Chicago, IL", linkedIn: "#", avatarColor: "#1e6e8c",
  },
  {
    id: 7, name: "Lena Fischer", initials: "LF", school: "INSEAD", year: "'23",
    transition: "BCG → Impact Investing", isCareerSwitcher: true,
    preMBA: "Strategy Consulting (BCG)", postMBA: "Impact Fund (Series A)",
    topics: ["Scholarships", "Essays", "Career advice"],
    location: "Amsterdam, NL", linkedIn: "#", avatarColor: "#5a7a2c",
  },
  {
    id: 8, name: "James Obi", initials: "JO", school: "Wharton", year: "'24",
    transition: "Finance → Healthcare VC", isCareerSwitcher: true,
    preMBA: "Investment Banking (JPMorgan)", postMBA: "Healthcare VC",
    topics: ["Interviews", "Networking", "Career advice"],
    location: "Philadelphia, PA", linkedIn: "#", avatarColor: "#8c3a3a",
  },
  {
    id: 9, name: "Chloe Tanaka", initials: "CT", school: "LBS", year: "'22",
    transition: "Marketing → Strategy Lead", isCareerSwitcher: false,
    preMBA: "Brand Marketing (Unilever)", postMBA: "Corporate Strategy",
    topics: ["School culture", "Essays"],
    location: "Tokyo, Japan", linkedIn: "#", avatarColor: "#4a6080",
  },
];

const SCHOOL_BADGE_COLORS = {
  Wharton:      { bg: "#011F5B", text: "#fff" },
  INSEAD:       { bg: "#003087", text: "#fff" },
  LBS:          { bg: "#002147", text: "#fff" },
  "MIT Sloan":  { bg: "#A31F34", text: "#fff" },
  "HEC Paris":  { bg: "#006A4E", text: "#fff" },
  Kellogg:      { bg: "#4E2A84", text: "#fff" },
};

const SCHOOLS   = ["All", "Wharton", "INSEAD", "LBS", "MIT Sloan", "HEC Paris", "Kellogg"];
const TOPICS    = ["All", "Essays", "Career advice", "Interviews", "Scholarships", "Networking", "School culture"];

// ─── Background blobs (matches your existing BackgroundAnimation) ─────────────
const BackgroundAnimation = memo(() => (
  <div className="absolute top-0 left-0 w-full h-[500px] pointer-events-none z-0 overflow-hidden">
    <div className="absolute top-[-10%] left-[-5%] w-[25rem] h-[25rem] rounded-full bg-blue-100 opacity-60 animate-blob"
      style={{ filter: "blur(60px)" }} />
    <div className="absolute top-[20%] right-[-5%] w-[20rem] h-[20rem] rounded-full bg-blue-100 opacity-60 animate-blob animation-delay-2000"
      style={{ filter: "blur(60px)" }} />
    <div className="absolute top-[40%] left-[30%] w-[15rem] h-[15rem] rounded-full bg-purple-100 opacity-40 animate-blob animation-delay-4000"
      style={{ filter: "blur(50px)" }} />
  </div>
));
BackgroundAnimation.displayName = "BackgroundAnimation";

// ─── Saved schools banner ─────────────────────────────────────────────────────
const SavedSchoolsBanner = memo(() => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center justify-between mb-8">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-[#002147]/10 rounded-xl flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-5 h-5 text-[#002147]" />
      </div>
      <div>
        <p className="text-sm font-semibold text-[#002147]">Alumni from your saved schools</p>
        <p className="text-xs text-gray-400 mt-0.5">
          You're applying to Wharton and INSEAD — these alumni went there.
        </p>
      </div>
    </div>
    <span className="text-xs font-semibold text-[#3598FE] bg-blue-50 border border-blue-100 px-3 py-1 rounded-full whitespace-nowrap">
      2 matches
    </span>
  </div>
));
SavedSchoolsBanner.displayName = "SavedSchoolsBanner";

// ─── Individual alumni card ───────────────────────────────────────────────────
const AlumniCard = memo(({ alum, index }) => {
  const badge = SCHOOL_BADGE_COLORS[alum.school] ?? { bg: "#002147", text: "#fff" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-5 flex flex-col gap-4 group"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 shadow"
          style={{ background: alum.avatarColor }}
        >
          {alum.initials}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-[#002147] text-[15px] leading-tight">{alum.name}</p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            {alum.school} {alum.year} · {alum.transition}
          </p>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ background: badge.bg, color: badge.text }}
        >
          {alum.school} {alum.year}
        </span>
        {alum.isCareerSwitcher && (
          <span className="text-xs font-medium text-[#3598FE] bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">
            Career switcher
          </span>
        )}
      </div>

      {/* Pre / Post MBA */}
      <div className="grid grid-cols-2 gap-3 bg-gray-50/70 rounded-xl p-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Pre-MBA</p>
          <p className="text-[12px] text-[#002147] font-medium leading-snug">{alum.preMBA}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Post-MBA</p>
          <p className="text-[12px] text-[#002147] font-medium leading-snug">{alum.postMBA}</p>
        </div>
      </div>

      {/* Topic pills */}
      <div className="flex flex-wrap gap-1.5">
        {alum.topics.map((t) => (
          <span
            key={t}
            className="text-[11px] border border-gray-200 text-gray-500 px-2.5 py-0.5 rounded-full hover:border-[#3598FE] hover:text-[#3598FE] transition-colors cursor-default"
          >
            {t}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <MapPin className="w-3.5 h-3.5" />
          {alum.location}
        </div>
        <a
          href={alum.linkedIn}
          className="flex items-center gap-1.5 text-xs font-semibold bg-[#002147] text-white px-3.5 py-1.5 rounded-xl hover:bg-[#3598FE] transition-colors duration-200 shadow-sm"
        >
          {/* LinkedIn icon */}
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
          Connect
        </a>
      </div>
    </motion.div>
  );
});
AlumniCard.displayName = "AlumniCard";

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AlumniPage() {
  const [search, setSearch]                     = useState("");
  const [school, setSchool]                     = useState("All");
  const [topic, setTopic]                       = useState("All");
  const [careerSwitcherOnly, setCareerSwitcher] = useState(false);

  const filtered = useMemo(() => ALUMNI.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      a.name.toLowerCase().includes(q) ||
      a.school.toLowerCase().includes(q) ||
      a.preMBA.toLowerCase().includes(q) ||
      a.postMBA.toLowerCase().includes(q) ||
      a.topics.some((t) => t.toLowerCase().includes(q));
    return (
      matchSearch &&
      (school === "All" || a.school === school) &&
      (topic  === "All" || a.topics.includes(topic)) &&
      (!careerSwitcherOnly || a.isCareerSwitcher)
    );
  }), [search, school, topic, careerSwitcherOnly]);

  return (
    <div className="min-h-screen bg-blue-50/60 relative overflow-hidden">
      <BackgroundAnimation />

      {/* ── Page header (mirrors HeroHeader style) ── */}
      <div className="relative z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-3xl md:text-5xl font-bold text-[#002147] tracking-tight"
          >
            Alumni<span className="text-[#3598FE]">.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.08 }}
            className="mt-2 text-sm md:text-base text-gray-500 max-w-xl font-medium leading-relaxed"
          >
            Browse alumni who've opted in to be discoverable. View their background and connect on LinkedIn.
            <br className="hidden sm:block" /> Reach out personally — no booking, no fees.
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 relative z-10">
        <SavedSchoolsBanner />

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, school, role, or topic..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-[#002147] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3598FE]/30 focus:border-[#3598FE] transition shadow-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 font-medium">School:</span>
            <select
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-[#002147] focus:outline-none focus:ring-2 focus:ring-[#3598FE]/30 shadow-sm"
            >
              {SCHOOLS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 font-medium">Topic:</span>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-[#002147] focus:outline-none focus:ring-2 focus:ring-[#3598FE]/30 shadow-sm"
            >
              {TOPICS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>

          <button
            onClick={() => setCareerSwitcher((v) => !v)}
            className={`text-xs font-medium px-3.5 py-1.5 rounded-lg border transition-all duration-200 ${
              careerSwitcherOnly
                ? "bg-[#002147] text-white border-[#002147] shadow-md"
                : "bg-white text-[#002147] border-gray-200 hover:border-[#3598FE] hover:text-[#3598FE]"
            }`}
          >
            Career switchers only
          </button>

          <span className="ml-auto text-xs text-gray-400 font-medium">{filtered.length} alumni</span>
        </div>

        {/* Section header (mirrors UniversitiesSection style) */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-[#002147]/10 rounded-xl">
            <GraduationCap className="w-5 h-5 text-[#002147]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#002147]">Browse Alumni</h2>
            <p className="text-sm text-gray-500">{filtered.length} alumni available to connect</p>
          </div>
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((alum, i) => (
              <AlumniCard key={alum.id} alum={alum} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white/50 rounded-2xl border border-gray-100 backdrop-blur-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-[#002147]" />
            </div>
            <h3 className="text-lg font-semibold text-[#002147] mb-2">No alumni match your filters</h3>
            <p className="text-sm text-gray-400">Try broadening your search or clearing some filters.</p>
            <button
              onClick={() => { setSearch(""); setSchool("All"); setTopic("All"); setCareerSwitcher(false); }}
              className="mt-5 px-5 py-2.5 bg-[#002147] text-white rounded-xl text-sm font-medium hover:bg-[#3598FE] transition-colors duration-200 inline-flex items-center gap-2 shadow"
            >
              Clear filters <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="h-20" aria-hidden="true" />
    </div>
  );
}