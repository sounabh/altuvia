'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Edit3,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Book,
  Search,
  LogOut
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from "next-auth/react";

const Layout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', comingSoon: false },
    { id: 'search', label: 'Search', icon: Search, href: '/dashboard/search', comingSoon: false },
    { id: 'calendar', label: 'Calendar', icon: Calendar, href: '/dashboard/calender', comingSoon: false },
    { id: 'essay', label: 'Essays', icon: Book, href: '/workspace/independent', comingSoon: false },
    { id: 'cv-builder', label: 'CV Builder', icon: FileText, href: '/cv-builder', comingSoon: false },
    { id: 'resource-hub', label: 'Resource Hub', icon: BookOpen, href: '/resources-hub', comingSoon: true },
  ];

  const handleItemClick = (href, comingSoon) => {
    if (comingSoon) return;
    router.push(href);
  };

  const handleLogout = async () => {
    await signOut({
      callbackUrl: "/onboarding/signup",
      redirect: true,
    });
  };

  return (
    <div className="flex h-screen w-screen">

      {/* Sidebar */}
      <div
        className={`bg-white shadow-lg transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-64'
        } flex flex-col justify-between`}
      >

        {/* TOP PART (Logo + Menu) */}
        <div>
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#6C7280]/10">
            {!isCollapsed && (
              <span className="font-roboto font-semibold tracking-[0.7px] leading-[28.8px] text-[22px] text-[#002147]">
                Altu<span className="text-[#3598FE]">Via</span>
              </span>
            )}

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="p-4 font-roboto">
            <ul className="space-y-3">
              {menuItems.map((item) => {
                const Icon = item.icon;

                let isActive = false;
                if (item.id === 'dashboard') {
                  isActive = pathname === '/dashboard';
                } else {
                  isActive =
                    pathname === item.href || pathname.startsWith(item.href + '/');
                }

                const isComingSoon = item.comingSoon;

                return (
                  <li key={item.id} className="relative">
                    <button
                      onClick={() => handleItemClick(item.href, item.comingSoon)}
                      disabled={isComingSoon}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative ${
                        isComingSoon
                          ? 'opacity-40 cursor-not-allowed'
                          : isActive
                          ? 'bg-[#002147] text-white shadow-md'
                          : 'text-[#002147] hover:bg-[#F0F4FA] hover:text-[#001e3e]'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 transition-colors ${
                          isComingSoon
                            ? 'text-[#002147]'
                            : isActive
                            ? 'text-white'
                            : 'text-[#002147] group-hover:text-[#001e3e]'
                        }`}
                      />

                      {!isCollapsed && (
                        <span
                          className={`font-medium text-sm tracking-[0.4px] ${
                            isComingSoon
                              ? 'text-[#002147]'
                              : isActive
                              ? 'text-white'
                              : 'text-[#002147] group-hover:text-[#001e3e]'
                          }`}
                        >
                          {item.label}
                        </span>
                      )}

                      {isComingSoon && (
                        <div className="absolute -top-2 -right-2 z-10">
                          <div className="relative bg-[#002147] text-white text-[10px] font-bold px-3 py-1 transform rotate-12 shadow-lg">
                            <span className="tracking-wider">SOON</span>
                            <div className="absolute -bottom-1 -left-1 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-[#001122]"></div>
                          </div>
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* BOTTOM PART – LOGOUT BUTTON */}
        <div className="p-4 mb-3">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-all ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>

      </div>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
};

export default Layout;
