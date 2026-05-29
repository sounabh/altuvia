"use client";
// app/dashboard/learn/LearnSidebar.jsx

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Grid,
  BookOpen,
  Edit3,
  Users,
  Clipboard,
  BarChart2,
  HelpCircle,
  Bookmark,
} from "lucide-react";

import { learnNavItems } from "@/lib/learnData";

const iconMap = {
  grid: Grid,
  book: BookOpen,
  edit: Edit3,
  user: Users,
  clipboard: Clipboard,
  "bar-chart": BarChart2,
  "help-circle": HelpCircle,
  bookmark: Bookmark,
};

export default function LearnSidebar() {
  const pathname = usePathname();

  const isActive = (href) => {
    if (href === "/dashboard/learn") {
      return pathname === "/dashboard/learn";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside
      className="w-56 shrink-0 bg-white border-r border-gray-200/70 flex flex-col"
      role="navigation"
      aria-label="Learn navigation"
    >
      <div className="px-5 pt-6 pb-3">
        <p className="text-[10px] font-semibold tracking-[1.2px] text-[#002147]/40 uppercase font-roboto">
          Learn
        </p>
      </div>

      <nav className="flex-1 px-3 pb-6 space-y-0.5">
        {learnNavItems.map((item) => {
          const Icon = iconMap[item.icon] ?? Grid;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`
                flex items-center gap-2.5 px-3 py-2.5 rounded-lg
                text-sm font-medium font-roboto tracking-[0.3px]
                transition-all duration-200 group
                ${
                  active
                    ? "bg-[#002147] text-white shadow-sm"
                    : "text-[#002147] hover:bg-[#F0F4FA] hover:text-[#001e3e]"
                }
              `}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  active
                    ? "text-white"
                    : "text-[#002147]/60 group-hover:text-[#3598FE]"
                }`}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}