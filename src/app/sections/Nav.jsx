"use client";
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

// Nav component: renders the top navigation bar
const Nav = () => {
  return (
    <nav className="pt-4">

      <div className="flex items-center justify-between">
        {/* Animated Brand/Logo section */}

        <div className="font-serif font-semibold tracking-[-0.1px] leading-[28.8px] text-[22px] text-[#002147] flex items-center">
          {/* "A" slides in from the left */}

          <motion.span
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            A
          </motion.span>
          {/* "ltu" remains static */}
          <span>ltu</span>
          {/* "via" slides up from the bottom with blue color */}
          <motion.span
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="text-[#3598FE]"
          >
            via
          </motion.span>
        </div>



        {/* Call-to-action button */}
        <Link href={"/onboarding/signup"}>
        <button className="px-3 py-3 md:px-5 md:py-3 rounded-lg hover:bg-[#3598FE] transition-all duration-700 ease-in-out bg-[#002147] text-white  font-medium text-balance text-[15px] flex items-center justify-center transform hover:rounded-3xl">
        Sign Up
        </button>
        </Link>
      </div>
    </nav>
  );
};

export default Nav;
