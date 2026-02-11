"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Nav from "./sections/Nav";
import Hero from "./sections/Hero";

// Lazy-load below-fold sections to reduce initial bundle & paint cost
const Steps = dynamic(() => import("./sections/Steps"), { ssr: false });
const ApplicationManagement = dynamic(
  () => import("./sections/ApplicationMgmt"),
  { ssr: false }
);
const Accordions = dynamic(() => import("./sections/Accordion"), {
  ssr: false,
});
const ProductShowcase = dynamic(() => import("./sections/Products"), {
  ssr: false,
});
const ContactUsPage = dynamic(() => import("./sections/ContactUsPage"), {
  ssr: false,
});
const AltuviaFooter = dynamic(() => import("./sections/Footer"), {
  ssr: false,
});

// ─── Loading Screen ──────────────────────────────────────────────
const LoadingScreen = ({
  onComplete,
}) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  // Pause Lenis while loading screen is active
  useEffect(() => {
    const lenis = (window ).__lenis;
    if (lenis) lenis.stop();
    return () => {
      if (lenis) lenis.start();
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#002147]"
    >
      <div className="relative">
        <div className="flex items-center justify-center">
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 0.8,
              delay: 0.2,
              ease: [0.6, -0.05, 0.01, 0.99],
            }}
            className="text-6xl md:text-8xl lg:text-9xl font-bold text-white"
            style={{ willChange: "transform, opacity" }}
          >
            ALT
          </motion.div>

          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 0.8,
              delay: 0.2,
              ease: [0.6, -0.05, 0.01, 0.99],
            }}
            className="text-6xl md:text-8xl lg:text-9xl font-bold bg-gradient-to-r from-[#3598FE] to-[#60B4FF] bg-clip-text text-transparent"
            style={{ willChange: "transform, opacity" }}
          >
            UVIA
          </motion.div>
        </div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.1 }}
          transition={{
            duration: 1,
            delay: 1,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="absolute inset-0 -z-10 rounded-full bg-white blur-3xl"
        />
      </div>
    </motion.div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────
const Page = () => {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadingComplete = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && (
          <LoadingScreen
            key="loading"
            onComplete={handleLoadingComplete}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoading ? 0 : 1 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        <div className="relative z-10 w-full max-w-[1130px] mx-auto px-5">
          <Nav />
        </div>

        <Hero />

        <div className="relative z-10 w-full max-w-[1130px] mx-auto px-5">
          <Steps />
          <ApplicationManagement />
          <Accordions />
          <ProductShowcase />
          <ContactUsPage />
          <AltuviaFooter />
        </div>
      </motion.div>
    </>
  );
};

export default Page;