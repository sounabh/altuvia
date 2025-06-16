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
    <div className="relative bg-white overflow-hidden">
      <section className="relative pt-16 sm:pt-20 lg:pt-24 pb-12 lg:pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">

          <div
            className={`text-center max-w-5xl mx-auto transform transition-all duration-1000 ease-out ${
              heroVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-[#002147] backdrop-blur-sm border border--[#002147] rounded-full px-4 sm:px-6 py-2 sm:py-3 mb-6 sm:mb-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              <span className="text-xs sm:text-sm font-medium text-white">
                Streamlined Process
              </span>
            </div>

            {/* Heading */}
            <h1 className="font-serif font-normal text--[#002147] text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight tracking-tight mb-6 sm:mb-8">
              <span className="block mb-2">Get up to 3.5x more</span>
              <span className="block">application success</span>
            </h1>

            {/* Description */}
            <div className="max-w-4xl mx-auto">
              <p className="font-sans font-normal text-slate-600 text-base sm:text-lg lg:text-xl leading-relaxed px-4">
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

                <h2 className="font-serif font-normal text--[#002147] text-xl sm:text-2xl lg:text-3xl xl:text-4xl leading-tight tracking-tight">
                  Start with a solid foundation
                </h2>

                <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-lg">
                  Build a personalized applicant profile that showcases your strengths,
                  achievements, and goals. This profile powers every part of your journey.
                </p>
              </AnimatedSection>

              {/* Right Icon Block */}
              <AnimatedSection direction="right" delay={400} className="order-1 lg:order-2">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-[#002147] rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative w-full h-64 sm:h-72 lg:h-80  bg-[#002147] rounded-2xl shadow-2xl transform group-hover:scale-105 transition-all duration-500 flex items-center justify-center">
                    <User className="w-16 h-16 text-white opacity-50" />
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

              {/* Left Image Block */}
              <AnimatedSection direction="left" delay={200} className="order-1">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-[#002147] rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative w-full h-64 sm:h-72 lg:h-80 xl:h-96 bg-[#002147] rounded-2xl shadow-2xl transform group-hover:scale-105 transition-all duration-500 flex items-center justify-center">
                    <FolderOpen className="w-16 h-16 text-white opacity-50" />
                  </div>
                </div>
              </AnimatedSection>

              {/* Right Text */}
              <AnimatedSection direction="right" delay={400} className="order-2 space-y-6">
                <div className="inline-flex items-center gap-2 bg-[#002147] text-white font-medium rounded-full px-4 py-2 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm">Organize Documents</span>
                </div>

                <h2 className="font-serif font-normal text-[#002147] text-xl sm:text-2xl lg:text-3xl xl:text-4xl leading-tight tracking-tight">
                  Everything in one place
                </h2>

                <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-lg">
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

                <h2 className="font-serif font-normal text-[#002147] text-xl sm:text-2xl lg:text-3xl xl:text-4xl leading-tight tracking-tight">
                  Ready to impress admissions
                </h2>

                <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-lg">
                  Submit polished applications with confidence, knowing every detail has been
                  reviewed and optimized for maximum impact.
                </p>
              </AnimatedSection>

              {/* Right Icon Block */}
              <AnimatedSection direction="right" delay={400} className="order-1 lg:order-2">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-[#002147] rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative w-full h-64 sm:h-72 lg:h-80 xl:h-96 bg-[#002147] rounded-2xl shadow-2xl transform group-hover:scale-105 transition-all duration-500 flex items-center justify-center">
                    <CheckCircle className="w-16 h-16 text-white opacity-50" />
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
            <h2 className="font-serif font-normal text-white text-2xl sm:text-3xl lg:text-4xl xl:text-5xl leading-tight tracking-tight mb-6">
              Ready to transform your applications?
            </h2>

            <p className="text-blue-100 text-base sm:text-lg lg:text-xl leading-relaxed mb-8 max-w-3xl mx-auto">
              Join thousands of students who have already streamlined their application process and increased their acceptance rates.
            </p>

            <button className="inline-flex items-center gap-3 bg-white text-slate-900 font-semibold px-8 py-4 rounded-full hover:bg-gray-100 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
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
