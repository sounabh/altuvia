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
  const [activeItem, setActiveItem] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();

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
      href: '/calendar',
    },
    {
      id: 'essay-editor',
      label: 'Essay Editor',
      icon: Edit3,
      href: '/essay-editor',
    },
    {
      id: 'resource-hub',
      label: 'Resource Hub',
      icon: BookOpen,
      href: '/resource-hub',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      href: '/settings',
    },
  ];

  const handleItemClick = (itemId, href) => {
    setActiveItem(itemId);
    router.push(href);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div
        className={`bg-white shadow-lg transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-64'
        } flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          {!isCollapsed && (
            <span className="font-serif font-semibold tracking-[-0.1px] leading-[28.8px] text-[22px] text-[#002147]">
              Altu<span className="text-[#3598FE]">via</span>
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
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
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
                        : 'text-[#002147]  hover:text-[#002147]'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 transition-colors ${
                        isActive ? 'text-white' : 'text-[#002147] group-hover:text-[#002147]'
                      }`}
                    />
                    {!isCollapsed && (
                      <span
                        className={`font-medium text-sm ${
                          isActive ? 'text-white' : 'text-[#002147] group-hover:text-[#002147]'
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
