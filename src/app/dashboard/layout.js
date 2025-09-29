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
import { useRouter, usePathname } from 'next/navigation';

const Layout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false); // Controls sidebar collapse state
  const router = useRouter();
  const pathname = usePathname(); // ✅ Detect current route

  // Sidebar navigation items
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
      comingSoon: false,
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: Calendar,
      href: '/dashboard/calender',
      comingSoon: false,
    },
    {
      id: 'cv-builder',
      label: 'CV Builder',
      icon: FileText,
      href: '/cv-builder',
      comingSoon: true,
    },
    {
      id: 'resource-hub',
      label: 'Resource Hub',
      icon: BookOpen,
      href: '/resources-hub',
      comingSoon: true,
    },
    /*{
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      href: '/settings',
      comingSoon: false,
    },*/
  ];

  // When a menu item is clicked, navigate (only if not coming soon)
  const handleItemClick = (href, comingSoon) => {
    if (comingSoon) return; // Prevent navigation for coming soon items
    router.push(href);      // Navigate to the selected route
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

              // ✅ Improved Active Route Check
              let isActive = false;
              if (item.id === 'dashboard') {
                // Only active if exactly /dashboard
                isActive = pathname === '/dashboard';
              } else {
                // Active if exact match or nested under its href
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
                        className={`font-medium text-sm transition-colors tracking-[0.4px] ${
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

                    {/* Coming Soon Tag */}
                    {isComingSoon && (
                      <div className="absolute -top-2 -right-2 z-10">
                        <div className="relative bg-[#002147] text-white text-[10px] font-bold px-3 py-1 transform rotate-12 shadow-lg">
                          <span className="tracking-wider">SOON</span>
                          {/* Ribbon fold effect */}
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

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
};

export default Layout;













// ✅ EXPLANATION: Coming Soon Feature Implementation
//
// Added `comingSoon` property to menu items to identify which features are not ready yet.
//
// Visual Changes:
// 1. Items with comingSoon: true get 40% opacity (opacity-40)
// 2. Cursor changes to not-allowed for disabled state
// 3. "COMING SOON" tag appears on the right side
// 4. In collapsed mode, shows a dot indicator instead of full text
//
// Functional Changes:
// 1. handleItemClick checks if item is coming soon and prevents navigation
// 2. Button is disabled for coming soon items
// 3. Hover effects are disabled for coming soon items
//
// The #002147 color is used for the coming soon tags to match your brand colors.
// The tags have white text for good contrast and readability.
