import React from "react";

const Nav = () => {
  return (
    <nav className="pt-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-inter font-semibold tracking-[-1.7px] leading-[28.8px] text-[22px]">
            Altuvia
          </span>
        </div>

        <button className="px-4 py-2 rounded-xl bg-[#1a1a1a] text-white font-inter font-medium text-balance text-[13px] flex items-center justify-center ">
          Get Started Today
        </button>
      </div>
    </nav>
  );
};

export default Nav;
