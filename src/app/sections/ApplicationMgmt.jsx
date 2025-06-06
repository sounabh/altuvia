"use client"

import React, { useState } from 'react';
import { FileText, Brain, School, Bell, History, BookOpen } from 'lucide-react';

export default function TypeformStyleApplicationManagement() {
  const [hoveredCard, setHoveredCard] = useState(null);

  const features = [
    {
      id: 1,
      icon: FileText,
      title: "Document Storage",
      description: "Store, organize, and access all your application documents in one secure location. Smart categorization keeps everything perfectly organized.",
      color: "bg-blue-50",
      iconColor: "text-blue-600",
      borderColor: "border-blue-100"
    },
    {
      id: 2,
      icon: Brain,
      title: "AI Writing Assistant",
      description: "Get intelligent suggestions, grammar corrections, and writing improvements powered by advanced AI to make your essays shine.",
      color: "bg-purple-50",
      iconColor: "text-purple-600",
      borderColor: "border-purple-100"
    },
    {
      id: 3,
      icon: School,
      title: "School Organization",
      description: "Create dedicated spaces for each school with custom requirements tracking, deadlines, and application-specific tools.",
      color: "bg-green-50",
      iconColor: "text-green-600",
      borderColor: "border-green-100"
    },
    {
      id: 4,
      icon: Bell,
      title: "Smart Reminders",
      description: "Never miss a deadline with intelligent notifications that adapt to your schedule and priority levels for each application.",
      color: "bg-orange-50",
      iconColor: "text-orange-600",
      borderColor: "border-orange-100"
    },
    {
      id: 5,
      icon: History,
      title: "Version History",
      description: "Track every change with automatic saving and version control. Compare drafts and restore previous versions with ease.",
      color: "bg-indigo-50",
      iconColor: "text-indigo-600",
      borderColor: "border-indigo-100"
    },
    {
      id: 6,
      icon: BookOpen,
      title: "Premium Resources",
      description: "Access curated templates, successful essay examples, and expert guidance to elevate your application quality.",
      color: "bg-pink-50",
      iconColor: "text-pink-600",
      borderColor: "border-pink-100"
    }
  ];

  return (
    <div className="min-h-screen bg-white py-24 px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-light text-gray-900 mb-8 tracking-tight leading-tight">
          
            <br />
            <span className="text-gray-500"></span>
          </h1>


 <h1 className="font-serif font-normal text-[#002147] w-full
        text-[36px]  md:text-[50px] lg:text-[48px]
        leading-[45px] sm:leading-[55px] md:leading-[65px] lg:leading-[67px]
        tracking-[-1.5px] sm:tracking-[-2px] md:tracking-[-2.5px] lg:tracking-[-0.6px]">
        <span className="block">  Application Management</span>
        <span className="block">Made Simple</span>
      </h1>

          
              

        </div>

        {/* Features Grid - Typeform Style */}
        <div className="grid grid-cols-1 lg:grid-cols-2 py-12 mt-16 md:mt-24 gap-8 mb-20">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            const isHovered = hoveredCard === feature.id;
            
            return (
              <div
                key={feature.id}
                className={`
                  group relative p-12 rounded-3xl transition-all duration-500 ease-out cursor-pointer
                  border-2 ${feature.borderColor} hover:border-gray-200
                  ${feature.color} hover:bg-white
                  hover:shadow-2xl hover:shadow-gray-100/50
                  ${isHovered ? 'scale-[1.02] -translate-y-1' : ''}
                `}
                onMouseEnter={() => setHoveredCard(feature.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                
                {/* Icon */}
                <div className={`
                  w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-8
                  transition-all duration-300 group-hover:scale-110
                  ${isHovered ? 'bg-white shadow-lg' : ''}
                `}>
                  <IconComponent className={`w-8 h-8 ${feature.iconColor}`} strokeWidth={1.5} />
                </div>

                {/* Content */}
                <div className="space-y-6">
                  <h3 className="text-3xl font-serif font-light text-gray-900 tracking-tight">
                    {feature.title}
                  </h3>
                  
                  <p className="text-lg font-inter text-gray-600 leading-relaxed font-light">
                    {feature.description}
                  </p>
                </div>

                {/* Hover Arrow */}
                <div className={`
                  absolute top-12 right-12 transition-all duration-300
                  ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}
                `}>
                  <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                    </svg>
                  </div>
                </div>

                {/* Subtle Gradient Overlay */}
                <div className={`
                  absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 
                  transition-opacity duration-500 pointer-events-none
                  bg-gradient-to-br from-white/80 via-transparent to-transparent
                `} />
              </div>
            );
          })}
        </div>

        {/* CTA Section - Typeform Style */}
        <div className="text-center">
          <div className="bg-[#002147] rounded-3xl px-16 py-12 md:px-20 relative overflow-hidden">
            
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: '40px 40px'
              }} />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto">
              <h1 className="font-serif font-normal text-white w-full
        text-[36px] sm:text-[48px] md:text-[56px] lg:text-[65px]
        leading-[45px] sm:leading-[55px] md:leading-[65px] lg:leading-[80px]
        tracking-[-1.5px] sm:tracking-[-2px] md:tracking-[-2.5px] lg:tracking-[-0.6px]">
        <span className="block">Ready To Get Started</span>
        
      </h1>
              
             
              <p className="font-inter font-normal text-white text-base sm:text-lg
        leading-[24px] sm:leading-[28px] md:leading-[30px] lg:leading-[32px]
        lg:w-1/2 max-w-xl sm:max-w-2xl mx-auto mt-2 lg:mt-3 sm:mt-3 md:mt-4 px-2 sm:px-4">
   Join thousands of students who have streamlined their application process
      
      </p>


              
              <button className="
                inline-flex items-center justify-center
                bg-white  px-12 py-5  
                text-lg font-medium tracking-wide

               rounded-lg hover:rounded-3xl hover:text-white hover:bg-[#3598FE] transition-all duration-700 ease-in-out  text-[#002147]
                group mt-7
              ">



                <span>Start for free</span>
                <svg className="w-5 h-5 ml-3 transition-transform duration-300 group-hover:translate-x-1" 
                     fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Section */}
      
      </div>
    </div>
  );
}