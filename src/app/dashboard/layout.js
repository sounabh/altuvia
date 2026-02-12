'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  LayoutDashboard,
  FileText,
  Calendar,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Book,
  Search,
  LogOut,
  MessageSquare
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from "next-auth/react";
import Head from 'next/head';
import Link from 'next/link';

// ============================================
// SIDEBAR LAYOUT COMPONENT
// Main navigation component for the application
// ============================================

const Layout = ({ children }) => {
  // ========== STATE MANAGEMENT ==========
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // ========== ROUTING HOOKS ==========
  const router = useRouter();
  const pathname = usePathname();

  // ============================================
  // MENU ITEMS CONFIGURATION
  // Define all navigation items with their properties
  // ============================================
  const menuItems = useMemo(() => [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      href: '/dashboard', 
      comingSoon: false,
      description: 'View your application dashboard'
    },
    { 
      id: 'search', 
      label: 'Search', 
      icon: Search, 
      href: '/dashboard/search', 
      comingSoon: false,
      description: 'Find and explore universities'
    },
    { 
      id: 'calendar', 
      label: 'Calendar', 
      icon: Calendar, 
      href: '/dashboard/calender', 
      comingSoon: false,
      description: 'Create your application Events'
    },
    { 
      id: 'essay', 
      label: 'Essays', 
      icon: Book, 
      href: '/workspace/independent', 
      comingSoon: false,
      description: 'Manage your application essays'
    },
    { 
      id: 'cv-builder', 
      label: 'CV Builder', 
      icon: FileText, 
      href: '/dashboard/cv-builder', 
      comingSoon: false,
      description: 'Build and edit your CV/resume'
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings, 
      href: '/dashboard/settings', 
      comingSoon: false,
      description: 'Adjust your account settings'
    },
    { 
      id: 'resource-hub', 
      label: 'Resource Hub', 
      icon: BookOpen, 
      href: '/resources-hub', 
      comingSoon: true,
      description: 'Access learning resources'
    },
  ], []);

  // ============================================
  // LOGOUT HANDLER
  // Handles user logout with redirect
  // ============================================
  const handleLogout = useCallback(async () => {
    try {
      await signOut({
        callbackUrl: "/onboarding/signup",
        redirect: true,
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  // ============================================
  // FEEDBACK HANDLER
  // Redirects to feedback page
  // ============================================
  const handleFeedback = useCallback(() => {
    router.push('/dashboard/feedback');
  }, [router]);

  // ============================================
  // SIDEBAR COLLAPSE HANDLER
  // Toggles sidebar visibility
  // ============================================
  const toggleSidebar = useCallback(() => {
    setIsCollapsed(prevState => !prevState);
  }, []);

  // ============================================
  // CHECK ACTIVE ROUTE
  // Determines if a menu item is currently active
  // ============================================
  const isRouteActive = useCallback((item) => {
    if (item.id === 'dashboard') {
      return pathname === '/dashboard';
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }, [pathname]);

  // ============================================
  // SEO META DATA
  // Dynamically generate page title based on current route
  // ============================================
  const getPageTitle = () => {
    const currentItem = menuItems.find(item => isRouteActive(item));
    return currentItem 
      ? `${currentItem.label} - Altuvia University Application Platform`
      : 'Altuvia - University Application Platform';
  };

  return (
    <>
      {/* ========== SEO HEAD SECTION ========== */}
      <Head>
        <title>{getPageTitle()}</title>
        <meta name="description" content="Altuvia - AI-powered university application platform helping students track applications, manage essays, and build CVs." />
        <meta name="keywords" content="university application, college admissions, essay writing, CV builder, application tracker" />
        <meta property="og:title" content={getPageTitle()} />
        <meta property="og:description" content="Track your university applications, manage essays, and build your CV with Altuvia's AI-powered platform." />
        <meta property="og:type" content="website" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* ========== MAIN LAYOUT CONTAINER ========== */}
      {/* CHANGED: removed "flex h-screen w-screen" — sidebar is now fixed, 
          so body scrolls naturally and Lenis controls it */}
      <div 
        role="application"
        aria-label="University application platform"
      >
        {/* ========== SIDEBAR SECTION ========== */}
        {/* CHANGED: added "fixed top-0 left-0 h-screen z-40" 
            so sidebar stays in place while body scrolls via Lenis */}
        <aside
          className={`fixed top-0 left-0 h-screen z-40 bg-white shadow-lg transition-all duration-300 ease-in-out ${
            isCollapsed ? 'w-16' : 'w-64'
          } flex flex-col justify-between`}
          role="navigation"
          aria-label="Main navigation"
        >
          {/* ========== SIDEBAR TOP SECTION ========== */}
          <div>
            {/* ========== SIDEBAR HEADER ========== */}
            <header className="flex items-center justify-between p-4 border-b border-[#6C7280]/10">
              {!isCollapsed && (
                <div className="flex items-center gap-2">
                  <span 
                    className="font-roboto font-semibold tracking-[0.7px] leading-[28.8px] text-[22px] text-[#002147]"
                    aria-label="Altuvia Logo"
                  >
                    Altu<span className="text-[#3598FE]">Via</span>
                  </span>
                </div>
              )}

              {/* ========== COLLAPSE TOGGLE BUTTON ========== */}
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#3598FE] focus:ring-opacity-50"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                aria-expanded={!isCollapsed}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-5 h-5 text-gray-600" aria-hidden="true" />
                ) : (
                  <ChevronLeft className="w-5 h-5 text-gray-600" aria-hidden="true" />
                )}
              </button>
            </header>

            {/* ========== NAVIGATION MENU ========== */}
            <nav className="p-4 font-roboto" aria-label="Primary navigation">
              <ul className="space-y-2" role="menubar">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isRouteActive(item);
                  const isComingSoon = item.comingSoon;

                  return (
                    <li key={item.id} className="relative" role="none">
                      {isComingSoon ? (
                        <button
                          disabled
                          className={`
                            w-full flex items-center gap-3 px-3 py-3 rounded-lg 
                            transition-all duration-200 group relative
                            opacity-40 cursor-not-allowed
                            focus:outline-none focus:ring-2 focus:ring-[#3598FE] focus:ring-opacity-50
                          `}
                          role="menuitem"
                          aria-label={item.label}
                          aria-describedby={`coming-soon-${item.id}`}
                        >
                          {/* ========== MENU ITEM ICON ========== */}
                          <Icon
                            className="w-5 h-5 transition-colors flex-shrink-0 text-[#002147]"
                            aria-hidden="true"
                          />

                          {/* ========== MENU ITEM LABEL ========== */}
                          {!isCollapsed && (
                            <span className="font-medium text-sm tracking-[0.4px] text-left truncate text-[#002147]">
                              {item.label}
                            </span>
                          )}

                          {/* ========== COMING SOON BADGE ========== */}
                          {!isCollapsed && (
                            <div 
                              className="absolute -top-2 -right-2 z-10"
                              id={`coming-soon-${item.id}`}
                              aria-label="Coming soon"
                            >
                              <div className="relative bg-[#002147] text-white text-[10px] font-bold px-3 py-1 transform rotate-12 shadow-lg">
                                <span className="tracking-wider">SOON</span>
                                <div className="absolute -bottom-1 -left-1 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-[#001122]"></div>
                              </div>
                            </div>
                          )}
                        </button>
                      ) : (
                        <Link
                          href={item.href}
                          className={`
                            w-full flex items-center gap-3 px-3 py-3 rounded-lg 
                            transition-all duration-200 group relative
                            focus:outline-none focus:ring-2 focus:ring-[#3598FE] focus:ring-opacity-50
                            ${isActive
                              ? 'bg-[#002147] text-white shadow-md'
                              : 'text-[#002147] hover:bg-[#F0F4FA] hover:text-[#001e3e]'
                            }
                          `}
                          role="menuitem"
                          aria-label={item.label}
                          aria-current={isActive ? 'page' : undefined}
                          prefetch={true}
                        >
                          {/* ========== MENU ITEM ICON ========== */}
                          <Icon
                            className={`
                              w-5 h-5 transition-colors flex-shrink-0
                              ${isActive
                                ? 'text-white'
                                : 'text-[#002147] group-hover:text-[#001e3e]'
                              }
                            `}
                            aria-hidden="true"
                          />

                          {/* ========== MENU ITEM LABEL ========== */}
                          {!isCollapsed && (
                            <span
                              className={`
                                font-medium text-sm tracking-[0.4px] text-left truncate
                                ${isActive
                                  ? 'text-white'
                                  : 'text-[#002147] group-hover:text-[#001e3e]'
                                }
                              `}
                            >
                              {item.label}
                            </span>
                          )}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* ========== SIDEBAR BOTTOM SECTION ========== */}
          <div className="p-4 mb-3 space-y-2 border-t border-[#6C7280]/10">
            {/* ========== FEEDBACK BUTTON ========== */}
            <button
              onClick={handleFeedback}
              className={`
                w-full flex items-center gap-3 px-3 py-3 rounded-lg 
               bg-[#002147]
                text-white font-medium 
                focus:outline-none focus:ring-2 focus:ring-[#3598FE] focus:ring-opacity-50
                shadow-md hover:shadow-lg transform hover:scale-[1.02]
                transition-all duration-200
                ${isCollapsed ? 'justify-center' : ''}
              `}
              aria-label="Share your feedback"
            >
              <MessageSquare className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full">
                  <span>Feedback</span>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                    🎯
                  </span>
                </div>
              )}
            </button>

            {/* ========== LOGOUT BUTTON ========== */}
            <button
              onClick={handleLogout}
              className={`
                w-full flex items-center gap-3 px-3 py-3 rounded-lg 
                bg-red-600 hover:bg-red-700 text-white font-medium 
                transition-all duration-200 focus:outline-none focus:ring-2 
                focus:ring-red-500 focus:ring-opacity-50
                ${isCollapsed ? 'justify-center' : ''}
              `}
              aria-label="Log out of your account"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        </aside>

        {/* ========== MAIN CONTENT AREA ========== */}
        {/* CHANGED: removed "flex-1 overflow-auto" 
            added "min-h-screen" + dynamic margin-left to match sidebar width
            Now content is in the body flow → Lenis scrolls it smoothly */}
        <main 
          className={`min-h-screen bg-blue-50/60 transition-all duration-300 ${
            isCollapsed ? 'ml-16' : 'ml-64'
          }`}
          role="main"
          aria-label="Application content"
        >
          {/* ========== PAGE CONTENT ========== */}
          {children}
        </main>
      </div>
    </>
  );
};

export default Layout;