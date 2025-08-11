import React from 'react';
import { ArrowLeft, Bell, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = ({ university }) => {
  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section: Back Button */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-[#002147]"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </div>

          {/* Center Section: School Title */}
          <div className="text-center flex-1 mx-4">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#002147] truncate">
              {university?.name || "University Profile"}
            </h1>
            {university?.location && (
              <p className="text-sm text-gray-600 hidden md:block">
                {university.location}
              </p>
            )}
          </div>

          {/* Right Section: Progress + Notification + Settings */}
          <div className="flex items-center space-x-2">
            {/* Progress Info */}
            <div className="text-right mr-4 hidden md:block">
              <span className="text-sm text-gray-600">65% Complete</span>
              <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                <div className="w-16 h-2 bg-[#3598FE] rounded-full transition-all duration-300"></div>
              </div>
            </div>

            {/* Notification Icon */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </Button>

            {/* Settings Icon */}
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Progress Bar */}
        <div className="mt-3 md:hidden">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>Application Progress</span>
            <span>65% Complete</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full">
            <div className="w-2/3 h-2 bg-[#3598FE] rounded-full transition-all duration-300"></div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;