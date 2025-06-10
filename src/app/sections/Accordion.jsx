import React from 'react';
import { Quote } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/modern-ui/accordion';

export default function AltuviaFAQ() {
  return (
    <div className='flex justify-center items-center flex-col text-center mt-44 md:mt-32 sm:mt-24 mb-20 md:mb-16 sm:mb-12 px-6 md:px-4 sm:px-3'>
             
      {/* Big Opening Quote Icon */}
    <Quote className="w-16 h-16 md:w-12 md:h-12 sm:w-10 sm:h-10 fill-[#002147] mb-2 mt-10 md:mt-8 sm:mt-6" />
             
      <h1 className="font-serif text-[#002147] tracking-[-1.9px] md:tracking-[-1.5px] sm:tracking-[-1.2px] leading-[57px] md:leading-[45px] sm:leading-[38px] text-[40px] lg:text-[42px] md:text-[38px] sm:text-[32px] font-medium w-full max-w-3xl md:max-w-2xl sm:max-w-2xl mt-12 md:mt-10 sm:mt-8">
        <span className="block">"Altuvia transformed my application </span>
        <span className="block">process. I felt organized and </span>
        <span className="block">confident!"</span>
      </h1>
             
      <span className='font-inter font-medium text-base md:text-sm sm:text-sm leading-[25px] md:leading-[22px] sm:leading-[20px] text-[#262C37] mt-6 md:mt-5 sm:mt-4'>Jessica Lee</span>
      <span className='font-inter leading-[27px] md:leading-[24px] sm:leading-[22px] text-[#404245] font-normal text-[14px] md:text-[13px] sm:text-[12px]'>MBA Applicant</span>
             
      <h1 className='font-serif leading-[60px] md:leading-[26px] sm:leading-[24px] tracking-[-2.3px] md:tracking-[-1.8px] sm:tracking-[-1.5px] text-[48px] md:text-[38px] sm:text-[32px] font-medium mt-26 lg:mt-32 md:mt-28  text-[#002147]'>
        Frequently Asked Questions
      </h1>
             
      <span className='font-inter font-normal text-[17px] md:text-[16px] sm:text-[15px] leading-[25px] md:leading-[23px] sm:leading-[22px] text-[#404245] mt-7 md:mt-6 sm:mt-5 mb-12 md:mb-10 sm:mb-8'>Got questions? We've got answers.</span>
             
      <div className="w-full max-w-4xl md:max-w-3xl sm:max-w-xl">
        <Accordion type="single" collapsible className="w-full space-y-4 md:space-y-3 sm:space-y-2">
          <AccordionItem value="item-1" className="border border-gray-200 rounded-lg px-6 md:px-5 sm:px-4 py-2 bg-white shadow-sm hover:shadow-md transition-shadow">
            <AccordionTrigger className="text-left font-inter font-semibold text-lg md:text-base sm:text-sm text-[#262C37] hover:text-black py-6 md:py-5 sm:py-4">
              How does Altuvia help me stay organized?
            </AccordionTrigger>
            <AccordionContent className="font-inter font-normal text-base md:text-sm sm:text-sm leading-[25px] md:leading-[22px] sm:leading-[20px] text-[#404245] pb-6 md:pb-5 sm:pb-4 pt-2 text-left">
              Altuvia centralizes all your applications, deadlines, and documents in one user-friendly workspace.
            </AccordionContent>
          </AccordionItem>
           
          <AccordionItem value="item-2" className="border border-gray-200 rounded-lg px-6 md:px-5 sm:px-4 py-2 bg-white shadow-sm hover:shadow-md transition-shadow">
            <AccordionTrigger className="text-left font-inter font-semibold text-lg md:text-base sm:text-sm text-[#262C37] hover:text-black py-6 md:py-5 sm:py-4">
              Is there a limit on the number of applications I can track?
            </AccordionTrigger>
            <AccordionContent className="font-inter font-normal text-base md:text-sm sm:text-sm leading-[25px] md:leading-[22px] sm:leading-[20px] text-[#404245] pb-6 md:pb-5 sm:pb-4 pt-2 text-left">
              No, you can track as many applications as needed in our Pro Plan.
            </AccordionContent>
          </AccordionItem>
           
          <AccordionItem value="item-3" className="border border-gray-200 rounded-lg px-6 md:px-5 sm:px-4 py-2 bg-white shadow-sm hover:shadow-md transition-shadow">
            <AccordionTrigger className="text-left font-inter font-semibold text-lg md:text-base sm:text-sm text-[#262C37] hover:text-black py-6 md:py-5 sm:py-4">
              Can I upgrade my plan later?
            </AccordionTrigger>
            <AccordionContent className="font-inter font-normal text-base md:text-sm sm:text-sm leading-[25px] md:leading-[22px] sm:leading-[20px] text-[#404245] pb-6 md:pb-5 sm:pb-4 pt-2 text-left">
              Absolutely! You can switch from the Free Plan to the Pro Plan at any time.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}