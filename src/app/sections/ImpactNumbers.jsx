"use client";

import React from "react";
import { Users, Smile, Clock } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const stats = [
  {
    icon: Users,
    number: "50K+",
    description: "Applications managed through Altuvia",
    gradient: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    icon: Smile,
    number: "95%",
    description: "Applicants report reduced stress",
    gradient: "from-green-500 to-green-600",
    bgColor: "bg-green-50",
    iconColor: "text-green-600",
  },
  {
    icon: Clock,
    number: "7+",
    description: "Years of combined experience",
    gradient: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50",
    iconColor: "text-purple-600",
  },
];

const ImpactNumbers = () => {
  return (
    <div className="flex justify-center items-center mt-20 md:mt-24 lg:mt-32 px-4">
      <div className="w-full max-w-md md:max-w-lg lg:max-w-xl">
        {/* Header Card */}
        <ScrollReveal direction="down" delay={0} duration={0.7}>
          <div className="bg-white rounded-2xl md:rounded-3xl border border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300 mb-6">
            <div className="p-6 md:p-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl mb-4">
                <div className="w-6 h-6 bg-white rounded-md"></div>
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 tracking-tight">
                By the Numbers
              </h2>
              <p className="text-base md:text-lg text-gray-600 font-medium">
                Our impact on future students
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* Stats */}
        <div className="space-y-4">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <ScrollReveal
                key={index}
                direction="left"
                delay={0.15 * (index + 1)}
                duration={0.7}
              >
                <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                  <div className="p-5 md:p-6 lg:p-7">
                    <div className="flex items-center space-x-4">
                      {/* Icon */}
                      <div
                        className={`flex-shrink-0 w-12 h-12 md:w-14 md:h-14 ${stat.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                      >
                        <IconComponent
                          className={`w-6 h-6 md:w-7 md:h-7 ${stat.iconColor}`}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline space-x-3">
                          <div
                            className={`text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}
                          >
                            {stat.number}
                          </div>
                          <div className="flex-1 h-px bg-gray-200 group-hover:bg-gray-300 transition-colors duration-300"></div>
                        </div>
                        <p className="text-sm md:text-base text-gray-600 mt-2 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                          {stat.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Hover accent bar */}
                  <div
                    className={`h-1 bg-gradient-to-r ${stat.gradient} rounded-b-xl md:rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                  ></div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        {/* Bottom dots */}
        <ScrollReveal direction="up" delay={0.6} duration={0.5}>
          <div className="mt-6 flex justify-center">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <div
                className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"
                style={{ animationDelay: "0.4s" }}
              ></div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
};

export default ImpactNumbers;