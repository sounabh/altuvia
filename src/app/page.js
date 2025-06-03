import React from 'react'
import Nav from './sections/Nav'
import Hero from './sections/Hero'
import Steps from './sections/Steps'
import ImpactNumbers from './sections/ImpactNumbers'
import Accordions from './sections/Accordion'
import AltuviaFooter from './sections/Footer'
import ContactUsPage from './sections/ContactUsPage'
import PricingCards from './sections/Pricing'
import ApplicationManagement from './sections/ApplicationMgmt'

const page = () => {
  return (
    <div className='w-full'>
   <Nav></Nav>
   <Hero></Hero>
   <Steps></Steps>
   <ApplicationManagement></ApplicationManagement>
   <ImpactNumbers></ImpactNumbers>
   <PricingCards></PricingCards>
   <Accordions></Accordions>

      <ContactUsPage></ContactUsPage>
   <AltuviaFooter></AltuviaFooter>

   
    </div>
  )
}

export default page
