import React from 'react'
import Nav from './sections/Nav'
import Hero from './sections/Hero'
import Steps from './sections/Steps'
import ImpactNumbers from './sections/ImpactNumbers'
import Accordions from './sections/Accordion'

const page = () => {
  return (
    <div className='w-full'>
   <Nav></Nav>
   <Hero></Hero>
   <Steps></Steps>
   <ImpactNumbers></ImpactNumbers>
   <Accordions></Accordions>
   
    </div>
  )
}

export default page
