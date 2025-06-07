"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  User,
  FolderOpen,
  CheckCircle,
  Sparkles,
} from "lucide-react";

const Steps = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="relative bg-white overflow-hidden py-12 mt-12">
      {/* Hero Section */}
      <div className="relative pt-24 lg:pt-32 ">
        <div className="container mx-auto px-6">
          <div
            className={`text-center max-w-4xl mx-auto transform transition-all duration-1000 ease-out ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            <div className="inline-flex items-center gap-2 bg-[#002147] backdrop-blur-sm border border-[#002147] rounded-full px-6 py-3 mb-8 shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
              <span className="text-sm font-medium text-white">
                Streamlined Process
              </span>
            </div>

            <h1
              className="font-serif font-normal text-[#002147] w-full
              text-[36px] sm:text-[48px] md:text-[56px] lg:text-[45px]
              leading-[45px] sm:leading-[55px] md:leading-[65px] lg:leading-[57px]
              tracking-[-1.5px] sm:tracking-[-2px] md:tracking-[-2.5px] lg:tracking-[-0.6px] mt-14 md:mt-10 lg:mt-8"
            >
              <span className="block">Get up to 3.5x more</span>
              <span className="block">application success</span>
            </h1>

            <p
              className="font-inter font-normal text-[#6C7280] text-base sm:text-lg
              leading-[24px] sm:leading-[28px] md:leading-[30px] lg:leading-[32px]
               mt-6 md:max-w-3xl   mx-auto lg:mt-7 md:mt-4 px-2 sm:px-4"
            >
              <span className="block">
                When your application process breaks the norm, more students get
                accepted.Think personalized profiles, smart organization, and strategic
                guidance.
              </span>
             
            </p>
          </div>
        </div>
      </div>

      {/* Section 1 - Profile Setup */}
      <div className="mt-16">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Left Content */}
            <div
              className={`order-2 lg:order-1 transition-all duration-700 ease-out ${
                isVisible
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-10 opacity-0"
              }`}
              style={{ transitionDelay: "200ms" }}
            >
              <div className="mb-4">
                <div className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-600 font-medium rounded-full px-4 py-2">
                  <User className="w-5 h-5" />
                  Create Your Profile
                </div>
              </div>
                <h1 className="font-serif font-normal text-[#002147] w-full
        text-[18px] md:text-[20px] lg:text-[24px]
        leading-[45px] sm:leading-[55px] md:leading-[65px] lg:leading-[80px]
        tracking-[-0.5px]  md:tracking-[-0.5px] lg:tracking-[-0.6px] md-mt-4 -mt-2">
        <span className="block">Start with a solid foundation</span>
       
      </h1>
              <p className="text-[#6C7280] text-base leading-relaxed">
                Build a personalized applicant profile that showcases your strengths,
                achievements, and goals. This profile powers every part of your journey.
              </p>
            </div>

            {/* Right Content (Image/Graphic placeholder) */}
            <div className="order-1 lg:order-2">
              <div className="w-full h-64 bg-indigo-100 rounded-xl" />
            </div>
          </div>
        </div>
      </div>






    
      {/* Section 3 - Submit With Confidence */}
      <div className="py-10 lg:py-10">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">



              {/* Right Content */}
            <div className="order-1 lg:order-1">
              <div className="w-full h-64 bg-green-100 rounded-xl" />
            </div>
            {/* Left Content */}
            <div
              className={`order-2 lg:order-1 transition-all duration-700 ease-out ${
                isVisible
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-10 opacity-0"
              }`}
              style={{ transitionDelay: "400ms" }}
            >
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 bg-green-50 text-green-600 font-medium rounded-full px-4 py-2">
                    <FolderOpen className="w-5 h-5" />
                    Organize Documents
                </div>
              </div>
              <h1 className="font-serif font-normal text-[#002147] w-full
        text-[18px] md:text-[20px] lg:text-[24px]
        leading-[45px] sm:leading-[55px] md:leading-[65px] lg:leading-[80px]
        tracking-[-0.5px]  md:tracking-[-0.5px] lg:tracking-[-0.6px] -mt-5">
        <span className="block">  Everything in one place</span>
       
      </h1>
             

 


              <p className="text-[#6C7280] text-base leading-relaxed ">
                 Automatically organize your resumes, essays, and test scores by school
                and deadline. No more digging through folders.
              </p>
            </div>

          
          </div>
        </div>
      </div>
    </div>
  );
};

export default Steps;
