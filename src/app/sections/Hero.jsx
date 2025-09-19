"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

// Animation variants for staggered effect
const containerVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      staggerChildren: 0.15,
    },
  },
};

const childVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

//Hero Section
const Hero = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check for token on mount (client-side only)
  useEffect(() => {
    const { token } = JSON.parse(localStorage.getItem("authData")) || {};
    setIsLoggedIn(!!token); // true if token exists
  }, []);

  return (
    <motion.div
      className="flex flex-col items-center justify-center text-center px-4 mt-20 md:mt-20 lg:mt-36 gap-3 lg:gap-[10px]"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Main Heading */}
      <motion.h1 variants={childVariants}>
        <span className="block">Admissions</span>
        <span className="block">Made Effortless</span>
      </motion.h1>

      {/* Subheading */}
      <motion.p variants={childVariants}>
        <span className="block">Centralize all your MBA & college</span>
        <span className="block">applications for a stress-free experience.</span>
      </motion.p>

      {/* Buttons */}
      <motion.div
        variants={childVariants}
        className="flex flex-col md:flex-row items-center gap-4 md:gap-3 mt-6 w-full md:w-auto"
      >
        <Link href={isLoggedIn ? "/search" : "/onboarding/signup"}>
          <button className="w-full sm:w-auto px-4 md:px-5 py-[10px] md:py-[12px] rounded-lg bg-[#002147] hover:bg-[#3598FE] transition-all duration-700 ease-in-out transform hover:rounded-3xl text-white font-inter font-medium text-[14px] leading-[24px] md:leading-[27px] flex items-center justify-center">
            Start Your Journey
          </button>
        </Link>

        <button className="w-full sm:w-auto px-4 md:px-5 py-[10px] md:py-[12px] rounded-lg border border-[#002147] transition-all duration-700 ease-in-out transform hover:rounded-3xl text-[#002147] font-inter font-medium text-[14px] leading-[24px] md:leading-[27px] flex items-center justify-center">
          Learn More
        </button>
      </motion.div>
    </motion.div>
  );
};

export default Hero;