"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";

// Animation variants for staggered effect
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      staggerChildren: 0.1,
    },
  },
};

const childVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.6, -0.05, 0.01, 0.99],
    },
  },
};

const blobVariants = {
  animate: {
    scale: [1, 1.2, 1],
    rotate: [0, 90, 0],
    transition: {
      duration: 20,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

// Hero Section
const Hero = () => {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && !!session?.user;

  //console.log("🔐 Hero Session Data:", session);

  return (
    <>
      {/* Background Gradient Blobs - Now positioned absolutely to the viewport */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        {/* Top right blob - Extended beyond boundaries */}
        <motion.div
          variants={blobVariants}
          animate="animate"
          className="absolute -top-48 -right-48 w-[500px] h-[500px] md:w-[700px] md:h-[700px] lg:w-[800px] lg:h-[800px] rounded-full bg-gradient-to-br from-blue-200 via-blue-100 to-transparent opacity-70 blur-3xl"
        />

        {/* Center left blob - Extended */}
        <motion.div
          variants={blobVariants}
          animate="animate"
          style={{ animationDelay: "2s" }}
          className="absolute top-1/3 -left-64 w-[500px] h-[500px] md:w-[600px] md:h-[600px] lg:w-[700px] lg:h-[700px] rounded-full bg-gradient-to-tr from-indigo-200 via-blue-100 to-transparent opacity-60 blur-3xl"
        />

        {/* Bottom center blob - Extended */}
        <motion.div
          variants={blobVariants}
          animate="animate"
          style={{ animationDelay: "4s" }}
          className="absolute -bottom-48 left-1/2 transform -translate-x-1/2 w-[500px] h-[500px] md:w-[650px] md:h-[650px] lg:w-[750px] lg:h-[750px] rounded-full bg-gradient-to-t from-slate-100 via-gray-50 to-transparent opacity-50 blur-3xl"
        />

        {/* Additional blob for more coverage */}
        <motion.div
          variants={blobVariants}
          animate="animate"
          style={{ animationDelay: "6s" }}
          className="absolute top-1/2 right-1/3 w-[400px] h-[400px] md:w-[500px] md:h-[500px] rounded-full bg-gradient-to-bl from-blue-50 to-transparent opacity-40 blur-3xl"
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #002147 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <section className="relative flex items-center justify-center">
        <motion.div
          className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-20 md:py-24 lg:py-30 w-full max-w-5xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Badge */}
          <motion.div variants={childVariants} className="mb-6 md:mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-blue-100 text-[#002147] text-sm font-medium shadow-lg">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Beta version
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            variants={childVariants}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-[#002147] leading-tight tracking-tight"
          >
            <span className="block">Admissions</span>
            <span className="block bg-gradient-to-r from-[#002147] to-[#3598FE] bg-clip-text text-transparent">
              Made Effortless
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={childVariants}
            className="mt-6 md:mt-8 text-lg sm:text-xl md:text-2xl text-gray-600 max-w-2xl leading-relaxed tracking-tight"
          >
            Centralize all your MBA & college applications for a stress-free,
            streamlined experience.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={childVariants}
            className="flex flex-col sm:flex-row items-center gap-4 mt-10 md:mt-12"
          >
            <Link
              href={
                isLoggedIn && session?.hasCompleteProfile
                  ? "/search"
                  : "/onboarding/signup"
              }
            >
              <button className="px-3 py-3 md:px-5 md:py-4 rounded-lg hover:bg-[#3598FE] transition-all duration-700 ease-in-out bg-[#002147] text-white font-medium text-balance text-[15px] flex items-center justify-center transform hover:rounded-3xl">
                Start Your Journey
              </button>
            </Link>

            <Link href="/">
              <button className="px-3 py-3 md:px-5 md:py-4 rounded-lg transition-all duration-700 ease-in-out bg-transparent border-2 border-[#002147] text-[#002147] font-medium text-balance text-[15px] flex items-center justify-center transform hover:rounded-3xl">
                Learn More
              </button>
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </>
  );
};

export default Hero;
