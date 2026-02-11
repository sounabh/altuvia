"use client";

import React from "react";
import ScrollReveal from "./ScrollReveal";

const ProductShowcase = () => {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto text-left lg:mt-56 mt-44">
        {/* Header */}
        <ScrollReveal direction="up" delay={0} duration={0.8}>
          <div className="mb-20 text-left">
            <h1 className="tracking-[-1.5px] text-center sm:tracking-[-2px] md:tracking-[-2.5px] lg:tracking-[-1.9px] leading-[45px] sm:leading-[55px] md:leading-[65px] lg:leading-[57px] text-[36px] sm:text-[48px] md:text-[56px] lg:text-[48px] font-medium w-full text-[#002147]">
              <span className="block">Ready to Take Control</span>
              <span className="block">of Your Applications?</span>
            </h1>

            <p className="leading-[24px] sm:leading-[28px] md:leading-[30px] lg:leading-[32px] text-[#404245] font-normal text-base lg:text-[18px] sm:text-lg max-w-xl sm:max-w-2xl w-full px-2 sm:px-4 mx-auto text-center mt-2 lg:mt-5 md:mt-4">
              <span className="block">
                Join thousands of successful applicants with Altuvia now.
              </span>
            </p>
          </div>
        </ScrollReveal>

        {/* Showcase Section */}
        <div className="relative flex items-start justify-center sm:justify-start py-12 mt-16 md:mt-24">
          {/* Desktop Mockup */}
          <ScrollReveal
            direction="left"
            delay={0.2}
            duration={1}
            className="relative z-10 hidden sm:block"
          >
            <div
              className="sm:w-[600px] sm:h-[390px] lg:w-[800px] lg:h-[520px] bg-gradient-to-br from-white to-gray-50 rounded-3xl border-8 border-[#002147] shadow-[12px_12px_30px_0px_rgba(0,0,0,0.4)] relative overflow-hidden left-[150px]
              hover:scale-[1.02] transition-transform duration-500 ease-out"
            >
              <img
                src="/desktop.png"
                alt="Desktop Application"
                className="w-full h-full object-cover rounded-2xl"
                loading="lazy"
              />
            </div>
          </ScrollReveal>

          {/* Mobile Mockup */}
          <ScrollReveal
            direction="right"
            delay={0.4}
            duration={1}
            className="relative z-20 block sm:hidden lg:absolute lg:-top-0 lg:left-[750px] lg:block"
          >
            <div
              className="w-[250px] h-[450px] md:w-[310px] md:h-[600px] bg-gradient-to-br from-white to-gray-50 rounded-3xl border-8 border-black shadow-[12px_12px_30px_0px_rgba(0,0,0,0.4)] relative overflow-hidden
              hover:scale-[1.05] transition-transform duration-500 ease-out"
            >
              {/* Notch */}
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-20 h-6 bg-[#002147] rounded-full z-10"></div>

              {/* Screen */}
              <img
                src="/mobile.jpg"
                alt="Mobile Application"
                className="w-full h-full object-cover rounded-2xl"
                loading="lazy"
              />

              {/* Home Indicator */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-28 h-1 bg-[#002147] rounded-full z-10"></div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
};

export default ProductShowcase;