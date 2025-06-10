import React from 'react';

export default function PricingCards() {
  return (
    <div className="w-full min-h-screen px-4  lg:px-8 py-8 mt-20 lg:pt-44">
      <div className="max-w-6xl mx-auto">
        {/* Header Section - Centered */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <h1 className="font-serif tracking-[-1.5px] md:tracking-[-2.5px] lg:tracking-[-1.9px] leading-[45px] sm:leading-[55px] md:leading-[65px] lg:leading-[75px] text-[32px] sm:text-[40px] md:text-[48px] lg:text-[56px] font-medium w-full text-[#002147] mb-6">
            Choose Your Plan
          </h1>
          
          <p className="font-inter leading-[24px] sm:leading-[28px] md:leading-[30px] lg:leading-[32px] text-[#404245] font-normal text-base sm:text-lg max-w-2xl mx-auto">
            Start your journey stress-free with our flexible pricing.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="flex items-center justify-center py-12 mt-16 md:mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 max-w-5xl">
            
            {/* Free Plan Card */}
            <div className='w-full max-w-sm sm:max-w-md md:max-w-lg  mx-auto bg-gradient-to-br from-white to-gray-50 rounded-2xl sm:rounded-3xl border-1  md:border-1 border-[#002147] shadow-[8px_8px_20px_0px_rgba(0,0,0,0.3)] sm:shadow-[10px_10px_25px_0px_rgba(0,0,0,0.35)] lg:shadow-[12px_12px_30px_0px_rgba(0,0,0,0.4)] hover:shadow-[10px_10px_25px_0px_rgba(0,0,0,0.4)] sm:hover:shadow-[14px_14px_35px_0px_rgba(0,0,0,0.45)] lg:hover:shadow-[16px_16px_40px_0px_rgba(0,0,0,0.5)] transition-all duration-500 ease-out relative overflow-hidden group lg:h-[80%] '>

              <div className="p-6 sm:p-8 md:p-10">
                {/* Header */}
                <div className="text-center mb-6 sm:mb-8">
                  <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🆓</div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#002147] mb-2">Free Plan</h3>
                </div>

                {/* Features */}
                <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700 text-sm sm:text-base">1 active calendar</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700 text-sm sm:text-base">1 AI-generated CV</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700 text-sm sm:text-base">3 essay workspaces</span>
                  </div>
                </div>



  

                {/* CTA Button */}
                <button className="w-full px-4  md:px-5 lg:px-4 py-[10px] ] md:py-[12px] lg:py-[10px] rounded-lg bg-[#002147] border-0 outline-0 leading-[24px]  md:leading-[27px] text-white font-inter font-medium text-balance text-[13px] sm:text-[14px] flex items-center justify-center   hover:bg-[#3598FE] transition-all duration-700 ease-in-out transform hover:rounded-3xl">
                  Start Free Trial
                </button>
              </div>

              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-purple-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            </div>

            {/* Pro Plan Card */}
          <div className='w-full max-w-sm sm:max-w-md md:max-w-lg mx-auto bg-gradient-to-br from-white to-gray-50 rounded-2xl sm:rounded-3xl border-1  md:border-1 border-[#002147] shadow-[8px_8px_20px_0px_rgba(0,0,0,0.3)] sm:shadow-[10px_10px_25px_0px_rgba(0,0,0,0.35)] lg:shadow-[12px_12px_30px_0px_rgba(0,0,0,0.4)] hover:shadow-[10px_10px_25px_0px_rgba(0,0,0,0.4)] sm:hover:shadow-[14px_14px_35px_0px_rgba(0,0,0,0.45)] lg:hover:shadow-[16px_16px_40px_0px_rgba(0,0,0,0.5)] transition-all duration-500 ease-out relative overflow-hidden group'>
              
              {/* Popular Badge */}
              <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-bl-2xl rounded-tr-2xl text-xs font-semibold">
                POPULAR
              </div>

              <div className="p-6 sm:p-8 md:p-10">
                {/* Header */}
                <div className="text-center mb-6 sm:mb-8">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#002147] mb-2">Pro Plan</h3>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#002147] mb-1">$7.99</div>
                  <div className="text-gray-600 text-sm">/month</div>
                </div>

                {/* Features */}
                <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700 text-sm sm:text-base">Unlimited calendars and CVs</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700 text-sm sm:text-base">Advanced AI tools</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700 text-sm sm:text-base">Full document storage</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700 text-sm sm:text-base">Exclusive resources</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700 text-sm sm:text-base">Priority access to new features</span>
                  </div>
                </div>

                {/* CTA Button */}
                <button className="w-full px-4 sm:px-4 md:px-5 lg:px-4 py-[10px] sm:py-[10px] md:py-[12px] lg:py-[10px] rounded-lg bg-[#002147] border-0 outline-0 leading-[24px] sm:leading-[26px] md:leading-[27px] text-white font-inter font-medium text-balance text-[13px] sm:text-[14px] flex items-center justify-center hover:bg-[#3598FE] transition-all duration-700 ease-in-out transform hover:rounded-3xl">
                  Start Free Trial
                </button>
              </div>

              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/20 to-pink-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            </div>
          </div>
        </div>
        
        {/* Bottom spacing */}
        <div className="h-8 sm:h-12 lg:h-16"></div>
      </div>
    </div>
  );
}