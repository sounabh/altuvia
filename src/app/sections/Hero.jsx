import React from 'react';

const Hero = () => {
  return (
    <div className="flex justify-center items-center flex-col sm:gap-3 md:gap-4 lg:gap-[14px] text-center mt-12 sm:mt-16 md:mt-18 lg:mt-20 px-4">
      <h1 className="font-inter tracking-[-1.5px] sm:tracking-[-2px] md:tracking-[-2.5px] lg:tracking-[-2.9px] leading-[45px] sm:leading-[55px] md:leading-[65px] lg:leading-[80px] text-[36px] sm:text-[48px] md:text-[56px] lg:text-[65px] font-semibold w-full text-[#1A1A1A]">
        <span className="block">Admissions</span>
        <span className="block">Made Effortless</span>
      </h1>

      <p className="font-inter leading-[24px] sm:leading-[28px] md:leading-[30px] lg:leading-[32px] text-[#404245] font-normal text-base sm:text-lg max-w-xl sm:max-w-2xl w-full px-2 sm:px-4 mx-auto text-center mt-2 sm:mt-3 md:mt-4">
        <span className="block">Centralize all your MBA & college</span>
        <span className="block">applications for a stress-free experience.</span>
      </p>

      <div className='flex flex-col sm:flex-row gap-3 sm:gap-4 items-center mt-6 sm:mt-4 w-full sm:w-auto px-4 sm:px-0'>
        
        <button className="w-full sm:w-auto px-4 sm:px-4 md:px-5 lg:px-4 py-[10px] sm:py-[10px] md:py-[12px] lg:py-[10px] rounded-xl bg-[#1a1a1a] border-0 outline-0 leading-[24px] sm:leading-[26px] md:leading-[27px] text-white font-inter font-medium text-balance text-[13px] sm:text-[14px] flex items-center justify-center">
          Start Your Journey
        </button>
        
        <button className="w-full sm:w-auto px-4 sm:px-4 md:px-5 lg:px-4 py-[10px] sm:py-[10px] md:py-[12px] lg:py-[10px] rounded-xl border border-[#1a1a1a2d] leading-[24px] sm:leading-[26px] md:leading-[27px] text-[#1a1a1a] font-inter font-medium text-balance text-[13px] sm:text-[14px] flex items-center justify-center">
          Learn More
        </button>
      </div>
    </div>
  );
};

export default Hero;