import React from 'react';

// Hero component: renders the hero section with heading, subheading, and action buttons
const Hero = () => {
  return (

    // Outer container: centers content and applies responsive vertical spacing and padding
    <div className="flex flex-col items-center justify-center text-center px-4 mt-20  md:mt-20 lg:mt-36 gap-3 sm:gap-4 lg:gap-[14px]">
      

      {/* Main heading: responsive text, spacing, font styling */}
      <h1 className="font-serif font-normal text-[#002147] w-full
        text-[36px] sm:text-[48px] md:text-[56px] lg:text-[65px]
        leading-[45px] sm:leading-[55px] md:leading-[65px] lg:leading-[80px]
        tracking-[-1.5px] sm:tracking-[-2px] md:tracking-[-2.5px] lg:tracking-[-0.6px]">
        <span className="block">Admissions</span>
        <span className="block">Made Effortless</span>
      </h1>

      {/* Subheading/paragraph: responsive size and spacing */}
      <p className="font-inter font-normal text-[#6C7280] text-base sm:text-lg
        leading-[24px] sm:leading-[28px] md:leading-[30px] lg:leading-[32px]
        w-full max-w-xl sm:max-w-2xl mx-auto mt-2 lg:mt-1 sm:mt-3 md:mt-4 px-2 sm:px-4">
        <span className="block">Centralize all your MBA & college</span>
        <span className="block">applications for a stress-free experience.</span>
      </p>


      {/* CTA buttons container: stacks vertically on mobile, inline on larger screens */}
      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mt-6 sm:mt-4 w-full sm:w-auto">
        

        {/* Primary button: filled style */}
        <button className="w-full sm:w-auto px-4 md:px-5 py-[10px] md:py-[12px]
          rounded-lg bg-[#002147]   hover:bg-[#3598FE] transition-all duration-700 ease-in-out transform hover:rounded-3xl text-white font-inter font-medium text-[13px] sm:text-[14px]
          leading-[24px] sm:leading-[26px] md:leading-[27px] flex items-center justify-center">
          Start Your Journey
        </button>
        
        
        {/* Secondary button: outlined style */}
        <button className="w-full sm:w-auto px-4 md:px-5 py-[10px] md:py-[12px]
          rounded-lg border border-[#002147]   transition-all duration-700 ease-in-out transform hover:rounded-3xl text-[#002147] font-inter font-medium text-[13px] sm:text-[14px]
          leading-[24px] sm:leading-[26px] md:leading-[27px] flex items-center justify-center">
          Learn More
        </button>

      </div>
    </div>
  );
};

export default Hero;
