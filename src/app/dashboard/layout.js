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
  ChevronRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const Layout = ({ children }) => {
  const [activeItem, setActiveItem] = useState('dashboard'); // Tracks which menu item is currently active
  const [isCollapsed, setIsCollapsed] = useState(false); // Controls sidebar collapse state
  const router = useRouter();

  // Sidebar navigation items
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
    },
    {
      id: 'cv-builder',
      label: 'CV Builder',
      icon: FileText,
      href: '/cv-builder',
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: Calendar,
      href: '/dashboard/calender',
    },
    {
      id: 'resource-hub',
      label: 'Resource Hub',
      icon: BookOpen,
      href: '/resources-hub',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      href: '/settings',
    },
  ];

  // When a menu item is clicked, set it as active and navigate
  const handleItemClick = (itemId, href) => {
    setActiveItem(itemId); // This enables the active styling below
    router.push(href);     // Navigate to the selected route
  };

  return (
    <div className="flex h-screen w-screen">

      {/* Sidebar */}
      <div
        className={`bg-white shadow-lg transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-64'
        } flex flex-col`}
      >


        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#6C7280]/10">

          {/* App Name */}
          {!isCollapsed && (
            <span className="font-roboto font-semibold tracking-[0.7px] leading-[28.8px] text-[22px] text-[#002147]">
              Altu<span className="text-[#3598FE]">Via</span>
            </span>
          )}



          {/* Collapse Button */}
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
        <nav className="flex-1 p-4 font-roboto">
          <ul className="space-y-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;


              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleItemClick(item.id, item.href)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                      isActive
                        ? 'bg-[#002147] text-white shadow-md'
                        : 'text-[#002147] hover:bg-[#F0F4FA] hover:text-[#001e3e]'
                    }`}
                  >

                    <Icon
                      className={`w-5 h-5 transition-colors ${
                        isActive
                          ? 'text-white'
                          : 'text-[#002147] group-hover:text-[#001e3e]'
                      }`}
                    />
                    {!isCollapsed && (
                      <span
                        className={`font-medium text-sm transition-colors tracking-[0.4px] ${
                          isActive
                            ? 'text-white'
                            : 'text-[#002147] group-hover:text-[#001e3e]'
                        }`}
                      >
                        {item.label}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>


      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
};

export default Layout;












// ✅ EXPLANATION: Why we check `activeItem === item.id`
//
// Imagine you have 3 chairs (buttons) on the screen:
// Chair A (dashboard), Chair B (calendar), Chair C (cv-builder)
//
// When you click Chair B, you set it as active:
// setActiveItem('calendar');
//
// But React doesn't just remember which one you clicked.
// It re-renders ALL chairs (buttons) again.
//
// Now, during render, each chair must ask:
// => "Am I the one that was clicked? Am I the active one?"
//
// That's why we check:
// const isActive = activeItem === item.id;
//
// It works like a teacher giving a gold star ⭐:
// The teacher asks each student:
// => "Is your name equal to the active name I saved?"
//
// Only the one that matches gets the star (active styles).
//
// So even if you clicked just one button,
// All buttons still need to check if they are the active one.
//
// 🔁 Without this check, you won’t know which button to style as active!
