import React from "react";
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

const page = () => {

  
  
 

  return (
    <div className="w-full  max-w-[1130px] mx-auto px-5"> 
      {/* The main page component that includes all sections px-4*/}
      <Nav></Nav>
      <Hero></Hero>
      <Marquee></Marquee>
      <Steps></Steps>
      <ApplicationManagement></ApplicationManagement>
      {/* <ImpactNumbers></ImpactNumbers>*/}
      <PricingCards></PricingCards>
      <Accordions></Accordions>
      <ProductShowcase></ProductShowcase>

      <ContactUsPage></ContactUsPage>
      <AltuviaFooter></AltuviaFooter>
    </div>
  );
};

export default page;
