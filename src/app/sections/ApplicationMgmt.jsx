"use client"

import React, { useState } from 'react';
import { FileText, Brain, School, Bell, History, BookOpen } from 'lucide-react';

export default function ApplicationManagement() {
  const [hoveredCard, setHoveredCard] = useState(null);

  const features = [
    {
      id: 1,
      icon: FileText,
      title: "Document Storage",
      description: "Safely store all your important files in one secure, organized place with unlimited storage capacity and smart categorization.",
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-600",
      stats: "1000+ Documents",
      delay: "0ms"
    },
    {
      id: 2,
      icon: Brain,
      title: "AI Writing Tools",
      description: "Enhance your essays with intelligent suggestions, grammar checking, and real-time feedback powered by advanced AI.",
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-50 to-pink-50",
      borderColor: "border-purple-200",
      textColor: "text-purple-600",
      stats: "95% Accuracy",
      delay: "100ms"
    },
    {
      id: 3,
      icon: School,
      title: "School-Specific Pages",
      description: "Organize your applications by school for greater efficiency with customized dashboards and requirement tracking.",
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-50 to-emerald-50",
      borderColor: "border-green-200",
      textColor: "text-green-600",
      stats: "50+ Schools",
      delay: "200ms"
    },
    {
      id: 4,
      icon: Bell,
      title: "Deadline Alerts",
      description: "Receive timely reminders and notifications to stay ahead of important deadlines and never miss submissions.",
      gradient: "from-red-500 to-orange-500",
      bgGradient: "from-red-50 to-orange-50",
      borderColor: "border-red-200",
      textColor: "text-red-600",
      stats: "Real-time Alerts",
      delay: "300ms"
    },
    {
      id: 5,
      icon: History,
      title: "Version Tracking",
      description: "Keep track of document changes and revision history to avoid confusion and maintain backup versions.",
      gradient: "from-indigo-500 to-blue-500",
      bgGradient: "from-indigo-50 to-blue-50",
      borderColor: "border-indigo-200",
      textColor: "text-indigo-600",
      stats: "Unlimited Versions",
      delay: "400ms"
    },
    {
      id: 6,
      icon: BookOpen,
      title: "Resource Hub",
      description: "Access exclusive materials, templates, guides, and examples to boost your application success rate.",
      gradient: "from-orange-500 to-yellow-500",
      bgGradient: "from-orange-50 to-yellow-50",
      borderColor: "border-orange-200",
      textColor: "text-orange-600",
      stats: "500+ Resources",
      delay: "500ms"
    }
  ];

  return (
    <div className="min-h-screen lg:mt-48 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
        
          <h1 className="font-inter tracking-[-1.5px] md:tracking-[-2.5px] lg:tracking-[-1.9px] leading-[45px] sm:leading-[55px] md:leading-[65px] lg:leading-[75px] text-[32px] sm:text-[40px] md:text-[48px] lg:text-[56px] font-semibold w-full text-[#1A1A1A] mb-4">
            <span className="bg-[#1a1a1a] bg-clip-text text-transparent">
              Comprehensive
            </span>
            <br />
            <span className="text-gray-800">Application Management</span>
          </h1>
          <p className="font-inter leading-[24px] sm:leading-[28px] md:leading-[30px] lg:leading-[32px] text-[#404245] font-normal text-lg">
          Features that simplify your application process.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={feature.id}
                className={`group relative bg-white rounded-3xl p-8 transition-all duration-700 ease-out hover:scale-105 hover:-translate-y-2 shadow-lg hover:shadow-2xl border-4 border-black animate-slide-up`}
                style={{ animationDelay: feature.delay }}
                onMouseEnter={() => setHoveredCard(feature.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} rounded-3xl opacity-0 group-hover:opacity-50 transition-opacity duration-500`} />
                <div className="absolute -top-2 -right-2 w-20 h-20 bg-gradient-to-r from-white/20 to-white/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-gradient-to-r from-white/20 to-white/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                {/* Card Content */}
                <div className="relative z-10">
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${feature.gradient}  rounded-2xl mb-6 shadow-lg group-hover:shadow-xl transition-shadow duration-300 group-hover:rotate-3 transform`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-gray-800 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-base leading-relaxed mb-6 group-hover:text-gray-700 transition-colors duration-300">
                    {feature.description}
                  </p>
                  <div className={`inline-flex items-center px-4 py-2 bg-gradient-to-r ${feature.bgGradient} rounded-full border ${feature.borderColor} transition-all duration-300 group-hover:scale-105`}>
                    <div className={`w-2 h-2 ${feature.gradient} bg-gradient-to-r rounded-full mr-2 animate-pulse`} />
                    <span className={`text-sm font-semibold ${feature.textColor}`}>
                      {feature.stats}
                    </span>
                  </div>

                  {/* Arrow Icon */}
                  <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                    <div className={`w-8 h-8 bg-gradient-to-r ${feature.gradient} rounded-full flex items-center justify-center shadow-lg`}>
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Animated Border */}
               
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="mt-20 text-center animate-fade-in-up" style={{ animationDelay: '600ms' }}>
          <div className="bg-[#1a1a1a] rounded-3xl p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 " />
       <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cg fill=&quot;none&quot; fill-rule=&quot;evenodd&quot;%3E%3Cg fill=&quot;%23ffffff&quot; fill-opacity=&quot;0.1&quot;%3E%3Ccircle cx=&quot;30&quot; cy=&quot;30&quot; r=&quot;2&quot;/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] animate-pulse" />

            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to Transform Your Applications?
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Join thousands of students who have streamlined their college application process
              </p>
              <button className="bg-white text-[#1a1a1a] px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-gray-50 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
                Get Started Today
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }

        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out forwards;
        }

        @keyframes slide-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.7s ease-out forwards;
        }

        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 6s linear infinite;
        }
      `}</style>
    </div>
  );
}
