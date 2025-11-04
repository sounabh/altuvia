"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  User,
  FolderOpen,
  CheckCircle,
  Sparkles,
} from "lucide-react";



/* ----------------------------------------------------------------------------
   Custom Hook: useIntersectionObserver
   - Used for scroll-based animations.
   - Observes if an element is visible in the viewport.
----------------------------------------------------------------------------- */
const useIntersectionObserver = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold }
    );

    if (ref.current) observer.observe(ref.current);

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, [threshold]);

  return [ref, isVisible];
};



/* ----------------------------------------------------------------------------
   AnimatedSection Component
   - Wraps children with slide-in + fade-in animations when scrolled into view.
----------------------------------------------------------------------------- */
const AnimatedSection = ({ children, direction = "left", delay = 0, className = "" }) => {
  const [ref, isVisible] = useIntersectionObserver(0.1);

  const baseClasses = "transition-all duration-700 ease-out";

  const animationClasses = isVisible
    ? "translate-x-0 opacity-100"
    : direction === "left"
    ? "-translate-x-16 opacity-0"
    : "translate-x-16 opacity-0";

  return (
    <div
      ref={ref}
      className={`${baseClasses} ${animationClasses} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};



/* ----------------------------------------------------------------------------
   Steps Component
   - Main exported component for "Steps" section
   - Includes Hero + Features + Call to Action
----------------------------------------------------------------------------- */
const Steps = () => {
  const [heroVisible, setHeroVisible] = useState(false);

  // Trigger hero section animation after 100ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setHeroVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);



  /* ------------------------------------------
     Hero Section
  ------------------------------------------ */
  return (
    <div className="relative bg-transparent overflow-hidden">
      <section className="relative pt-16 sm:pt-20 lg:pt-24 pb-12 lg:pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">

          <div
            className={`text-center max-w-5xl mx-auto transform transition-all duration-1000 ease-out ${
              heroVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-[#002147] backdrop-blur-sm border border-[#002147] rounded-full px-4 sm:px-6 py-2 sm:py-3 mb-6 sm:mb-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              <span className="text-xs sm:text-sm font-medium text-white">
                Streamlined Process
              </span>
            </div>

            {/* Heading */}
            <h1 className="font-normal text-[#002147] text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight tracking-tighter mb-6 sm:mb-8 font-jakarta">
              <span className="block mb-2">Get up to 3.5x more</span>
              <span className="block">application success</span>
            </h1>

            {/* Description */}
            <div className="max-w-4xl mx-auto">
              <p className="font-normal text-gray-600 text-base sm:text-lg lg:text-xl leading-relaxed px-4">
                When your application process breaks the norm, more students get
                accepted. Think personalized profiles, smart organization, and strategic
                guidance.
              </p>
            </div>
          </div>
        </div>
      </section>



      {/* ------------------------------------------
          Features Section
      ------------------------------------------ */}
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">


          {/* ---------------------------
              Feature 1: Profile Setup
          ---------------------------- */}
          <div className="mb-20 lg:mb-32">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 xl:gap-24 items-center">

              {/* Left Text */}
              <AnimatedSection direction="left" delay={200} className="order-2 lg:order-1 space-y-6">
                <div className="inline-flex items-center gap-2 bg-[#002147] text-white font-medium rounded-full px-4 py-2 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm">Create Your Profile</span>
                </div>

                <h2 className="font-semibold text-[#002147] text-xl sm:text-2xl lg:text-3xl xl:text-4xl leading-tight tracking-tight">
                  Start with a solid foundation
                </h2>

                <p className="text-grey-600 text-base sm:text-lg leading-relaxed max-w-lg">
                  Build a personalized applicant profile that showcases your strengths,
                  achievements, and goals. This profile powers every part of your journey.
                </p>
              </AnimatedSection>

              {/* Right Visual Block */}
              <AnimatedSection direction="right" delay={400} className="order-1 lg:order-2">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative w-full h-64 sm:h-72 lg:h-80 bg-gradient-to-br from-[#002147] via-[#003366] to-[#004488] rounded-2xl shadow-2xl transform group-hover:scale-105 transition-all duration-500 overflow-hidden">
                    {/* Animated background pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse"></div>
                      <div className="absolute bottom-10 right-10 w-40 h-40 bg-blue-300 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
                    </div>
                    
                    {/* Main content */}
                    <div className="relative h-full flex flex-col items-center justify-center p-8 space-y-6">
                      <div className="relative">
                        <div className="absolute inset-0 bg-white rounded-full blur-xl opacity-30 animate-pulse"></div>
                        <User className="relative w-20 h-20 text-white" strokeWidth={1.5} />
                      </div>
                      
                      {/* Info cards */}
                      <div className="space-y-3 w-full max-w-xs">
                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 transform hover:scale-105 transition-all duration-300">
                          <p className="text-white text-sm font-medium">Academic History</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 transform hover:scale-105 transition-all duration-300" style={{transitionDelay: '100ms'}}>
                          <p className="text-white text-sm font-medium">Extracurriculars</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 transform hover:scale-105 transition-all duration-300" style={{transitionDelay: '200ms'}}>
                          <p className="text-white text-sm font-medium">Personal Goals</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>



          {/* ---------------------------
              Feature 2: Document Organization
          ---------------------------- */}
          <div className="mb-20 lg:mb-32">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 xl:gap-24 items-center">

              {/* Left Visual Block */}
              <AnimatedSection direction="left" delay={200} className="order-1">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative w-full h-64 sm:h-72 lg:h-80 xl:h-96 bg-gradient-to-br from-[#002147] via-[#1a2b4a] to-[#2d3e5f] rounded-2xl shadow-2xl transform group-hover:scale-105 transition-all duration-500 overflow-hidden">
                    {/* Animated grid background */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="grid grid-cols-8 grid-rows-8 h-full w-full gap-2 p-4">
                        {[...Array(64)].map((_, i) => (
                          <div key={i} className="bg-white rounded" style={{animationDelay: `${i * 20}ms`}}></div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Main content */}
                    <div className="relative h-full flex flex-col items-center justify-center p-8 space-y-6">
                      <div className="relative">
                        <div className="absolute inset-0 bg-purple-400 rounded-lg blur-xl opacity-30 animate-pulse"></div>
                        <FolderOpen className="relative w-20 h-20 text-white" strokeWidth={1.5} />
                      </div>
                      
                      {/* Document cards */}
                      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3 transform hover:-translate-y-1 transition-all duration-300">
                          <div className="w-full h-2 bg-white/30 rounded mb-2"></div>
                          <div className="w-3/4 h-2 bg-white/20 rounded"></div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3 transform hover:-translate-y-1 transition-all duration-300" style={{transitionDelay: '100ms'}}>
                          <div className="w-full h-2 bg-white/30 rounded mb-2"></div>
                          <div className="w-2/3 h-2 bg-white/20 rounded"></div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3 transform hover:-translate-y-1 transition-all duration-300" style={{transitionDelay: '200ms'}}>
                          <div className="w-full h-2 bg-white/30 rounded mb-2"></div>
                          <div className="w-4/5 h-2 bg-white/20 rounded"></div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3 transform hover:-translate-y-1 transition-all duration-300" style={{transitionDelay: '300ms'}}>
                          <div className="w-full h-2 bg-white/30 rounded mb-2"></div>
                          <div className="w-3/5 h-2 bg-white/20 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedSection>

              {/* Right Text */}
              <AnimatedSection direction="right" delay={400} className="order-2 space-y-6">
                <div className="inline-flex items-center gap-2 bg-[#002147] text-white font-medium rounded-full px-4 py-2 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm">Organize Documents</span>
                </div>

                <h2 className="font-semibold text-[#002147] text-xl sm:text-2xl lg:text-3xl xl:text-4xl leading-tight tracking-tight">
                  Everything in one place
                </h2>

                <p className="text-gray-500 text-base sm:text-lg leading-relaxed max-w-lg">
                  Automatically organize your resumes, essays, and test scores by school
                  and deadline. No more digging through folders.
                </p>
              </AnimatedSection>
            </div>
          </div>



          {/* ---------------------------
              Feature 3: Submit With Confidence
          ---------------------------- */}
          <div>
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 xl:gap-24 items-center">

              {/* Left Text */}
              <AnimatedSection direction="left" delay={200} className="order-2 lg:order-1 space-y-6">
                <div className="inline-flex items-center gap-2 bg-[#002147] text-white font-medium rounded-full px-4 py-2 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm">Submit With Confidence</span>
                </div>

                <h2 className="font-semibold text-[#002147] text-xl sm:text-2xl lg:text-3xl xl:text-4xl leading-tight tracking-tight">
                  Ready to impress admissions
                </h2>

                <p className="text-gray-600 text-base sm:text-lg leading-relaxed max-w-lg">
                  Submit polished applications with confidence, knowing every detail has been
                  reviewed and optimized for maximum impact.
                </p>
              </AnimatedSection>

              {/* Right Visual Block */}
              <AnimatedSection direction="right" delay={400} className="order-1 lg:order-2">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative w-full h-64 sm:h-72 lg:h-80 xl:h-96 bg-gradient-to-br from-[#002147] via-[#003d5c] to-[#005a7a] rounded-2xl shadow-2xl transform group-hover:scale-105 transition-all duration-500 overflow-hidden">
                    {/* Animated circles */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-1/4 left-1/4 w-24 h-24 bg-green-300 rounded-full blur-2xl animate-pulse"></div>
                      <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-emerald-400 rounded-full blur-2xl animate-pulse" style={{animationDelay: '0.5s'}}></div>
                    </div>
                    
                    {/* Main content */}
                    <div className="relative h-full flex flex-col items-center justify-center p-8 space-y-8">
                      <div className="relative">
                        <div className="absolute inset-0 bg-green-400 rounded-full blur-2xl opacity-40 animate-pulse"></div>
                        <div className="relative bg-white/10 backdrop-blur-sm border-4 border-white/30 rounded-full p-6">
                          <CheckCircle className="w-16 h-16 text-white" strokeWidth={2} />
                        </div>
                      </div>
                      
                      {/* Progress indicators */}
                      <div className="space-y-3 w-full max-w-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-green-400 flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 w-full"></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-green-400 flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 w-full"></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-green-400 flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 w-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>



      {/* ------------------------------------------
          Call to Action Section
      ------------------------------------------ */}
      <section className="py-12 lg:py-20 bg-[#002147] rounded-2xl mt-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">

          <AnimatedSection direction="left" delay={0} className="text-center">
            <h2 className="font-semibold text-white text-2xl sm:text-3xl lg:text-3xl xl:text-5xl leading-tight tracking-tight mb-6">
              Ready to transform your applications?
            </h2>

            <p className="text-blue-100 text-base sm:text-lg lg:text-xl leading-relaxed mb-8 max-w-3xl mx-auto">
              Join thousands of students who have already streamlined their application process and increased their acceptance rates.
            </p>

            <button className="inline-flex items-center gap-3 bg-white text-slate-900 font-semibold px-6 py-3 rounded-full hover:bg-gray-100 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
              <span>Get Started Today</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </AnimatedSection>

        </div>
      </section>
    </div>
  );
};

export default Steps;