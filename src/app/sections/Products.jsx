"use client";
import React, { useState, useEffect } from "react";

/**
 * Mocking Framer Motion `motion.div` for environments
 * where animation engine or Framer Motion is not installed.
 */
const motion = {
  div: ({
    children,
    initial,
    animate,
    transition,
    whileHover,
    className,
    style,
    ...props
  }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    const getTransform = () => {
      let transform = "";

      // Apply entrance animations after mount
      if (mounted && animate) {
        if (animate.rotate !== undefined) transform += `rotate(${animate.rotate}deg) `;
        if (animate.scale !== undefined) transform += `scale(${animate.scale}) `;
        if (animate.x !== undefined) transform += `translateX(${animate.x}px) `;
        if (animate.y !== undefined) transform += `translateY(${animate.y}px) `;
      }

      // Apply hover transformations
      if (isHovered && whileHover) {
        if (whileHover.rotate !== undefined) transform += `rotate(${whileHover.rotate}deg) `;
        if (whileHover.scale !== undefined) transform += `scale(${whileHover.scale}) `;
        if (whileHover.y !== undefined) transform += `translateY(${whileHover.y}px) `;
      }

      return transform.trim();
    };

    return (
      <div
        className={className}
        style={{
          ...style,
          transform: getTransform(),
          transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        {children}
      </div>
    );
  },
};

// --------------------------------------------
// Main ProductShowcase Component
// --------------------------------------------
const ProductShowcase = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Delay visibility to enable animation effect
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto text-left lg:mt-56 mt-44">
        
        {/* ---------------------- */}
        {/* Header Section */}
        {/* ---------------------- */}
        <motion.div
          className="mb-20 text-left"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className=" tracking-[-1.5px] text-center sm:tracking-[-2px] md:tracking-[-2.5px] lg:tracking-[-1.9px] leading-[45px] sm:leading-[55px] md:leading-[65px] lg:leading-[57px] text-[36px] sm:text-[48px] md:text-[56px] lg:text-[48px] font-medium w-full text-[#002147]">
            <span className="block">Ready to Take Control</span>
            <span className="block">of Your Applications?</span>
          </h1>

          <p className="leading-[24px] sm:leading-[28px] md:leading-[30px] lg:leading-[32px] text-[#404245] font-normal text-base lg:text-[18px] sm:text-lg max-w-xl sm:max-w-2xl w-full px-2 sm:px-4 mx-auto text-center mt-2 lg:mt-5 md:mt-4">
            <span className="block">Join thousands of successful applicants with Altuvia now.</span>
          </p>
        </motion.div>

        {/* ---------------------- */}
        {/* Showcase Section */}
        {/* ---------------------- */}
        <div className="relative flex items-start justify-center sm:justify-start py-12 mt-16 md:mt-24">
          
          {/* -------------------------- */}
          {/* Desktop Mockup (Medium+) */}
          {/* -------------------------- */}
          <motion.div
            className="relative z-10 hidden sm:block"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 50 }}
            transition={{ duration: 1, delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="sm:w-[600px] sm:h-[390px] lg:w-[800px] lg:h-[520px] bg-gradient-to-br from-white to-gray-50 rounded-3xl border-8 border-[#002147] shadow-[12px_12px_30px_0px_rgba(0,0,0,0.4)] relative overflow-hidden left-[150px]">
              <img 
                src="/desktop.png" 
                alt="Desktop Application"
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>
          </motion.div>

          {/* -------------------------- */}
          {/* Mobile Mockup (Small + Large Screens) */}
          {/* -------------------------- */}
          <motion.div
            className="relative z-20 block sm:hidden lg:absolute lg:-top-0 lg:left-[750px] lg:block"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 50 }}
            transition={{ duration: 1, delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-[250px] h-[450px] md:w-[310px] md:h-[600px] bg-gradient-to-br from-white to-gray-50 rounded-3xl border-8 border-black shadow-[12px_12px_30px_0px_rgba(0,0,0,0.4)] relative overflow-hidden">
              
              {/* Mobile Notch */}
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-20 h-6 bg-[#002147] rounded-full z-10"></div>
              
              {/* Mobile Screen Content */}
              <img 
                src="/mobile.jpg" 
                alt="Mobile Application"
                className="w-full h-full object-cover rounded-2xl"
              />
              
              {/* Home Indicator */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-28 h-1 bg-[#002147] rounded-full z-10"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProductShowcase;