// app/dashboard/learn/page.jsx
// Learn Overview — matches Altuvia design system

import Link from "next/link";
import {
  BookOpen,
  Edit3,
  Users,
  Clipboard,
  BarChart2,
  HelpCircle,
  Bookmark,
  Sparkles,
} from "lucide-react";

const cards = [
  {
    href: "/dashboard/learn/school-guides",
    icon: BookOpen,
    iconBg: "bg-[#3598FE]/10",
    iconColor: "text-[#3598FE]",
    badge: "MOST USED",
    title: "School Guides",
    description:
      "Deep-dive pages for every school: deadlines, essay prompts, class profile, career outcomes. Maintained quarterly.",
    meta: "8 schools · Updated Apr 2026",
    size: "large",
  },
  {
    href: "/dashboard/learn/essay-workshop",
    icon: Edit3,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    title: "Essay Workshop",
    description:
      "A six-part mini-course on essay-writing as a skill. Plus a prompt decoder by essay archetype.",
    meta: "3 guides · ~3 hours",
    size: "large",
  },
  {
    href: "/dashboard/learn/interview-prep",
    icon: Users,
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
    title: "Interview Prep",
    description:
      "180 interview questions across 8 categories, with practice mode + alumni interview format guides.",
    meta: "In-browser recording · AI feedback (opt-in)",
    size: "large",
  },
  {
    href: "/dashboard/learn/application-playbooks",
    icon: Clipboard,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    title: "Application Playbooks",
    description:
      "Step-by-step checklists that sync with your Calendar. Flagship is the 12-month playbook from decision to submit.",
    meta: "6 playbooks · Trackable",
    size: "large",
  },
  {
    href: "/dashboard/learn/school-compare",
    icon: BarChart2,
    iconBg: "bg-[#3598FE]/10",
    iconColor: "text-[#3598FE]",
    title: "School Compare",
    description: "Side-by-side comparison tool.",
    size: "small",
  },
  {
    href: "/dashboard/learn/qa-forum",
    icon: HelpCircle,
    iconBg: "bg-[#3598FE]/10",
    iconColor: "text-[#3598FE]",
    title: "Q&A Forum",
    description: "Peer + alumni answers, upvoted.",
    size: "small",
  },
  {
    href: "/dashboard/learn/my-saved",
    icon: Bookmark,
    iconBg: "bg-[#3598FE]/10",
    iconColor: "text-[#3598FE]",
    title: "My Saved",
    description: "Your bookmarked resources.",
    size: "small",
  },
];

export default function LearnOverview() {
  const large = cards.filter((c) => c.size === "large");
  const small = cards.filter((c) => c.size === "small");

  return (
    <div>
      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-[#002147]/10 rounded-xl">
          <Sparkles className="w-5 h-5 text-[#002147]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#002147] font-roboto tracking-[0.4px]">
            Learn.
          </h1>
          <p className="text-sm text-gray-500 font-roboto">
            Everything you need to know about applying, in one place.
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-400 font-roboto mb-8">
        Platform-maintained guides — not a content feed.
      </p>

      {/* ── Large 2-col grid ─────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {large.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="
                rounded-2xl border border-gray-200/70 bg-white p-6
                hover:shadow-md hover:border-[#3598FE]/30
                transition-all duration-300 flex flex-col gap-4
                group
              "
            >
              <div className="flex items-start justify-between">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                  <Icon className={`w-5 h-5 ${card.iconColor}`} />
                </span>
                {card.badge && (
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#3598FE]/10 text-[#3598FE] tracking-wide font-roboto">
                    {card.badge}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-[#002147] text-base mb-1 font-roboto tracking-[0.3px]">
                  {card.title}
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed font-roboto">
                  {card.description}
                </p>
              </div>
              {card.meta && (
                <p className="text-xs text-[#3598FE] font-roboto font-medium mt-auto">
                  {card.meta}
                </p>
              )}
            </Link>
          );
        })}
      </div>

      {/* ── Small 3-col grid ─────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {small.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="
                rounded-2xl border border-gray-200/70 bg-white p-5
                hover:shadow-md hover:border-[#3598FE]/30
                transition-all duration-300 flex flex-col gap-3
                group
              "
            >
              <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                <Icon className={`w-4 h-4 ${card.iconColor}`} />
              </span>
              <div>
                <h2 className="font-semibold text-[#002147] text-sm mb-0.5 font-roboto tracking-[0.3px]">
                  {card.title}
                </h2>
                <p className="text-xs text-gray-500 font-roboto">{card.description}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── Connected banner ─────────────────────────────── */}
      <div className="rounded-2xl bg-[#002147] text-white px-6 py-5 flex items-center justify-between shadow-md">
        <div className="flex items-start gap-4">
          <Sparkles className="w-5 h-5 text-[#3598FE] mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-sm font-roboto">Connected to your applications</p>
            <p className="text-gray-300 text-xs mt-1 font-roboto leading-relaxed">
              School Guides surface deadlines on your Calendar. Essay Workshop links into the essays
              you're writing. Playbooks add milestones automatically.
            </p>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="
            shrink-0 ml-8 px-4 py-2 rounded-xl border border-white/20
            text-sm font-medium font-roboto hover:bg-white/10
            transition-colors whitespace-nowrap
          "
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}