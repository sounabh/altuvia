import React from 'react';
import { ArrowLeft, Bell, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">

        {/* Main header layout with 3 parts: Left - Center - Right */}
        <div className="flex items-center justify-between">

          {/* Left Section: Back Button */}
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-[#6C7280] hover:text-[#002147]"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Universities
            </Button>
          </div>

          {/* Center Section: School Title */}
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-[#002147]">
              Stanford Graduate School of Business
            </h1>
          </div>

          {/* Right Section: Progress + Notification + Settings */}
          <div className="flex items-center space-x-2">

            {/* Progress Info */}
            <div className="text-right mr-4">
              <span className="text-sm text-[#6C7280]">
                65% Complete
              </span>

              {/* Progress Bar (background + fill) */}
              <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                <div className="w-16 h-2 bg-[#3598FE] rounded-full transition-all duration-300"></div>
              </div>
            </div>

            {/* Notification Icon */}
            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" />
            </Button>

            {/* Settings Icon */}
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>

          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
