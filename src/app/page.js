"use client"

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Nav from "./sections/Nav";
import Hero from "./sections/Hero";
import Steps from "./sections/Steps";
import ImpactNumbers from "./sections/ImpactNumbers";
import Accordions from "./sections/Accordion";
import AltuviaFooter from "./sections/Footer";
import ContactUsPage from "./sections/ContactUsPage";
import PricingCards from "./sections/Pricing";
import ApplicationManagement from "./sections/ApplicationMgmt";
import Marquee from "./sections/Marqueee";
import ProductShowcase from "./sections/Products";

const LoadingScreen = ({ onComplete }) => {
  useEffect(() => {
    // Complete animation after 2.5 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#002147]"
    >
      <div className="relative">
        {/* Container to keep both parts on the same line */}
        <div className="flex items-center justify-center">
          {/* "ALT" coming from top */}
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 0.8,
              delay: 0.2,
              ease: [0.6, -0.05, 0.01, 0.99]
            }}
            className="text-6xl md:text-8xl lg:text-9xl font-bold text-white"
          >
            ALT
          </motion.div>
          
          {/* "UVIA" coming from bottom */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 0.8,
              delay: 0.2,
              ease: [0.6, -0.05, 0.01, 0.99]
            }}
            className="text-6xl md:text-8xl lg:text-9xl font-bold bg-gradient-to-r from-[#3598FE] to-[#60B4FF] bg-clip-text text-transparent"
          >
            UVIA
          </motion.div>
        </div>

        {/* Subtle pulse effect */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.1 }}
          transition={{
            duration: 1,
            delay: 1,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          className="absolute inset-0 -z-10 rounded-full bg-white blur-3xl"
        />
      </div>
    </motion.div>
  );
};

const Page = () => {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && (
          <LoadingScreen key="loading" onComplete={handleLoadingComplete} />
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
          <PricingCards />
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