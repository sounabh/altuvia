"use client"

import React, { useEffect } from "react";
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

const Page = () => {
 

  return (
    <div className="relative">
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
    </div>
  );
};

export default Page;