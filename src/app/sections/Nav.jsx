import React from "react";

// Nav component: renders the top navigation bar
const Nav = () => {
  return (
    // Outer <nav> element with top padding
    <nav className="pt-4">
      {/* Flex container for brand and button, spaced between */}
      <div className="flex items-center justify-between">
        {/* Brand/Logo section */}
        <div>
          <span className="font-serif font-semibold tracking-[-0.1px] leading-[28.8px] text-[22px] text-[#002147]">
            Altu 
            <span className="text-[#3598FE]">via</span>
          </span>
        </div>

        {/* Call-to-action button with smooth hover animations */}
        <button className="px-3 py-3 md:px-4 md:py-3 rounded-lg  hover:bg-[#3598FE] transition-all duration-700 ease-in-out bg-[#002147] text-white font-inter font-medium text-balance text-[13px] flex items-center justify-center transform hover:rounded-3xl">
          Get Started Today
        </button>
      </div>
    </nav>
  );
};

export default Nav;