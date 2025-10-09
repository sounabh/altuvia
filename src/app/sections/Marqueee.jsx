'use client';
import Image from 'next/image';
import React from 'react';

const UniversityMarquee = () => {
  const logos = [
    { name: 'Bocconi University', src: '/images/bocconi-university-logo-png_seeklogo-463777.png' },
    { name: 'MIT', src: '/images/mit.webp' },
    { name: 'NUS', src: '/images/nus.jpeg' },
    { name: 'Oxford', src: '/images/ox.jpeg' },
    { name: 'Cambridge', src: '/images/university-cambridge-full-colour-preferred-logo-transparency-2362x491.png' },
    { name: 'Yale', src: '/images/yale.jpeg' }
  ];


  const LogoImage = ({ logo, index, setKey }) => (
    <div key={`${setKey}-${index}`} className="flex-shrink-0 mx-6 flex items-center justify-center">
      <Image 
        src={logo.src} 
        alt={`${logo.name} logo`}
        height={60}
        width={120}
        className="object-contain h-12 w-auto max-w-[120px]"
        priority={setKey === 'first' && index < 3} // Prioritize first few images
      />
    </div>
  );


  return (
    <div className="w-full py-12 md:mt-24 mt-16">
      <div className="max-w-full mx-auto">
       
        <p className="font-inter leading-[24px] sm:leading-[28px] md:leading-[30px] text-center lg:leading-[32px] text-[#6C7280] font-normal text-lg">
       Empowering Students on Their Journey to Top Universities
          </p>
        
        {/* Marquee Container 
        
        
        
        
        */}
       
        
       
      </div>
      
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes marquee {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-33.333%);
            }
          }
          
          .animate-marquee {
            animation: marquee 25s linear infinite;
            width: max-content;
          }
          
          .hover-pause-marquee:hover .animate-marquee {
            animation-play-state: paused;
          }
          
          /* Responsive adjustments */
          @media (max-width: 768px) {
            .animate-marquee {
              animation-duration: 20s;
            }
          }
          
          @media (max-width: 480px) {
            .animate-marquee {
              animation-duration: 15s;
            }
          }
        `
      }} />
    </div>
  );
};

export default UniversityMarquee;


/*
  <div className="relative overflow-hidden hover-pause-marquee mt-10">
    <!-- Left Gradient -->
    <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
    
    <!-- Right Gradient -->
    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
    
    <!-- Marquee Animation -->
    <div className="flex animate-marquee items-center py-4">
      <!-- First set of logos -->
      {logos.map((logo, index) => (
        <LogoImage logo={logo} index={index} setKey="first" key={`first-${index}`} />
      ))}
      
      <!-- Duplicate set for seamless loop -->
      {logos.map((logo, index) => (
        <LogoImage logo={logo} index={index} setKey="second" key={`second-${index}`} />
      ))}
      
      <!-- Third set to ensure smooth transition -->
      {logos.map((logo, index) => (
        <LogoImage logo={logo} index={index} setKey="third" key={`third-${index}`} />
      ))}
    </div>
  </div>
*/
