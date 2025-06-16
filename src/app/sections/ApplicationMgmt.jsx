"use client"

import React, { useState, useEffect, useRef } from 'react';
import { FileText, Brain, School, Bell, History, BookOpen } from 'lucide-react';

export default function ModernApplicationManagement() {
  // Track hovered card for animation
  const [hoveredCard, setHoveredCard] = useState(null);

  // Track if section is in view for animation trigger
  const [isVisible, setIsVisible] = useState(false);

  // Ref for intersection observer to detect when component is in viewport
  const sectionRef = useRef(null);

  // Feature cards data
  const features = [
    {
      id: 1,
      icon: FileText,
      title: "Document Storage",
      description: "Store and organize all your application documents in one secure location with smart categorization.",
      iconColor: "text-blue-400",
      delay: 0
    },
    {
      id: 2,
      icon: Brain,
      title: "AI Writing Assistant",
      description: "Get intelligent suggestions and writing improvements powered by advanced AI technology.",
      iconColor: "text-purple-400",
      delay: 100
    },
    {
      id: 3,
      icon: School,
      title: "School Organization",
      description: "Create dedicated spaces for each school with custom requirements and deadline tracking.",
      iconColor: "text-green-400",
      delay: 200
    },
    {
      id: 4,
      icon: Bell,
      title: "Smart Reminders",
      description: "Never miss deadlines with intelligent notifications that adapt to your schedule.",
      iconColor: "text-orange-400",
      delay: 300
    },
    {
      id: 5,
      icon: History,
      title: "Version History",
      description: "Track changes with automatic saving and version control. Compare and restore drafts easily.",
      iconColor: "text-indigo-400",
      delay: 400
    },
    {
      id: 6,
      icon: BookOpen,
      title: "Premium Resources",
      description: "Access curated templates, successful examples, and expert guidance for better applications.",
      iconColor: "text-pink-400",
      delay: 500
    }
  ];

  // Run once to observe the section for entry animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -100px 0px'
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <div ref={sectionRef} className="min-h-screen bg-[#002147] py-20 px-4 lg:px-12 mt-52 rounded-2xl">
      <div className="max-w-6xl mx-auto">
        
        {/* ---------- Header Section ---------- */}
        <div className="text-center mb-16">
          <div className={`transform transition-all duration-1000 ease-out ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
          }`}>
            <h1 className="font-serif font-normal text-white w-full text-3xl sm:text-4xl md:text-5xl lg:text-65l leading-tight tracking-tight mb-4">
              <span className="block">Application Management</span>
              <span className="block">Made Simple</span>
            </h1>
            <p className="text-blue-100 text-base max-w-2xl mt-10 mx-auto font-light">
              Streamline your college application process with our comprehensive suite of tools
            </p>
          </div>
        </div>

        {/* ---------- Features Grid ---------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature) => {
            const IconComponent = feature.icon;
            const isHovered = hoveredCard === feature.id;
            
            return (
              <div
                key={feature.id}
                className={`
                  group relative p-6 sm:p-8 rounded-2xl transition-all duration-700 ease-out cursor-pointer
                  bg-white/5 backdrop-blur-sm border border-white/10
                  hover:bg-white/10 hover:border-white/20
                  hover:shadow-2xl hover:shadow-black/20
                  transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}
                  ${isHovered ? 'scale-105 -translate-y-2' : ''}
                `}
                style={{
                  transitionDelay: isVisible ? `${feature.delay}ms` : '0ms'
                }}
                onMouseEnter={() => setHoveredCard(feature.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* ---------- Icon ---------- */}
                <div className={`
                  w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6
                  transition-all duration-300 group-hover:scale-110 group-hover:bg-white/20
                `}>
                  <IconComponent className={`w-6 h-6 ${feature.iconColor}`} strokeWidth={1.5} />
                </div>

                {/* ---------- Title & Description ---------- */}
                <div className="space-y-4">
                  <h3 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-blue-100 leading-relaxed font-light">
                    {feature.description}
                  </p>
                </div>

                {/* ---------- Hover Arrow Effect ---------- */}
                <div className={`
                  absolute top-6 right-6 transition-all duration-300
                  ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}
                `}>
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                    </svg>
                  </div>
                </div>

                {/* ---------- Gradient Overlay on Hover ---------- */}
                <div className={`
                  absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 
                  transition-opacity duration-500 pointer-events-none
                  bg-gradient-to-br from-white/5 via-transparent to-transparent
                `} />

                {/* ---------- Subtle Border Glow Effect ---------- */}
                <div className={`
                  absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500
                  ${isHovered ? 'opacity-100' : ''}
                  bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 blur-sm -z-10
                `} />
              </div>
            );
          })}
        </div>

        {/* ---------- Decorative Bottom Line ---------- */}
        <div className={`
          mt-16 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent
          transform transition-all duration-1000 delay-700 ease-out
          ${isVisible ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'}
        `} />
      </div>
    </div>
  );
}
